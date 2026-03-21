import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchData, postData } from "@/lib/fetch-utlis";
import type { Conversation, Message, User } from "@/type";
import { io, type Socket } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const SOCKET_BASE = API_BASE.replace("/api/v1", "");

let socketRef: Socket | null = null;

export const getChatSocket = () => {
  if (socketRef) return socketRef;
  const token = localStorage.getItem("token");
  socketRef = io(SOCKET_BASE, {
    transports: ["websocket"],
    auth: { token },
  });
  return socketRef;
};

export const disconnectChatSocket = () => {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
};

export const useConversationsQuery = (workspaceId?: string | null) => {
  return useQuery<Conversation[]>({
    queryKey: ["chat-conversations", workspaceId],
    queryFn: async () => {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const res = await fetchData<{ err: number; response: Conversation[] }>(`/chat/conversations${query}`);
      return res?.response || [];
    },
    refetchOnWindowFocus: true,
  });
};

export const useMessagesQuery = (conversationId?: string | null) => {
  return useQuery<Message[]>({
    queryKey: ["chat-messages", conversationId],
    queryFn: async () => {
      const res = await fetchData<{ err: number; response: Message[] }>(
        `/chat/conversations/${conversationId}/messages`
      );
      return res?.response || [];
    },
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  });
};

export const useAllUsersQuery = () => {
  return useQuery<User[]>({
    queryKey: ["chat-users"],
    queryFn: async () => {
      const res = await fetchData<{ err: number; response: User[] }>("/auth/users");
      return res?.response || [];
    },
  });
};

export const useCreateDirectConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { targetUserId: string; workspaceId?: string | null }) =>
      postData("/chat/conversations/direct", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useCreateGroupConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; memberIds: string[]; workspaceId?: string | null }) =>
      postData("/chat/conversations/group", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useSendMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { conversationId: string; content: string }) =>
      postData(`/chat/conversations/${payload.conversationId}/messages`, { content: payload.content }),
    onSuccess: async (_res, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
};

export const useTypingState = (conversationId?: string | null) => {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  useEffect(() => {
    const socket = getChatSocket();
    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (!conversationId || payload.conversationId !== conversationId) return;
      setTypingUserIds((prev) => {
        if (payload.isTyping) return prev.includes(payload.userId) ? prev : [...prev, payload.userId];
        return prev.filter((id) => id !== payload.userId);
      });
    };
    socket.on("typing:update", onTyping);
    return () => {
      socket.off("typing:update", onTyping);
    };
  }, [conversationId]);
  return typingUserIds;
};

export const useOnlineUsers = () => {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [lastSeenAtByUserId, setLastSeenAtByUserId] = useState<Record<string, string>>({});
  useEffect(() => {
    const socket = getChatSocket();
    const onPresence = (payload: { onlineUserIds: string[]; lastSeenAtByUserId?: Record<string, string> }) => {
      setOnlineUserIds(payload.onlineUserIds || []);
      setLastSeenAtByUserId(payload.lastSeenAtByUserId || {});
    };
    socket.on("presence:update", onPresence);
    socket.emit("presence:sync");
    return () => {
      socket.off("presence:update", onPresence);
    };
  }, []);
  return { onlineUserIds, lastSeenAtByUserId };
};

export const useChatRealtime = (conversationId?: string | null) => {
  const queryClient = useQueryClient();
  const socket = useMemo(() => getChatSocket(), []);

  useEffect(() => {
    if (!conversationId) return;
    socket.emit("conversation:join", { conversationId });
  }, [conversationId, socket]);

  useEffect(() => {
    const onMessage = (payload: { conversationId: string; message: Message }) => {
      queryClient.setQueryData<Message[]>(["chat-messages", payload.conversationId], (old) => {
        const prev = old || [];
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    };

    const onReadUpdated = (payload: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages", payload.conversationId] });
    };

    socket.on("message:new", onMessage);
    socket.on("message:read:updated", onReadUpdated);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:read:updated", onReadUpdated);
    };
  }, [queryClient, socket]);

  return socket;
};

export const useUnreadChatCount = (workspaceId?: string | null) => {
  const { data: conversations = [] } = useConversationsQuery(workspaceId);
  const totalUnread = conversations.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0);
  return totalUnread;
};

