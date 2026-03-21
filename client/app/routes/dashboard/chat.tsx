import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/provider/auth-context";
import {
  getChatSocket,
  useAllUsersQuery,
  useChatRealtime,
  useConversationsQuery,
  useCreateDirectConversationMutation,
  useMessagesQuery,
  useOnlineUsers,
  useTypingState,
} from "@/hooks/use-chat";
import { Phone, Video } from "lucide-react";
import type { Conversation, User } from "@/type";

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectUserId, setSelectUserId] = useState("");
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingFromUserId, setIncomingFromUserId] = useState<string | null>(null);
  const [incomingMode, setIncomingMode] = useState<"audio" | "video">("audio");
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { data: users = [] } = useAllUsersQuery();
  const { data: conversations = [] } = useConversationsQuery(workspaceId);
  const { mutateAsync: createDirectConversation } = useCreateDirectConversationMutation();
  const socket = useChatRealtime(activeConversationId);
  const { onlineUserIds, lastSeenAtByUserId } = useOnlineUsers();
  const typingUserIds = useTypingState(activeConversationId);
  const [, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const { data: messages = [] } = useMessagesQuery(activeConversationId);

  useEffect(() => {
    if (!activeConversationId && conversations.length) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (activeConversationId) {
      socket.emit("message:read", { conversationId: activeConversationId });
    }
  }, [activeConversationId, socket]);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === "group") return conversation.title || "Nhóm";
    const other = conversation.members?.find((m) => m.user_id !== user?.id)?.user;
    return other?.username || "Direct chat";
  };

  const getOtherUser = (conversation: Conversation): User | null => {
    const other = conversation.members?.find((m) => m.user_id !== user?.id)?.user;
    return other || null;
  };

  const getPresenceText = (targetUserId?: string | null) => {
    if (!targetUserId) return "Offline";
    const isOnline = onlineUserIds.includes(targetUserId);
    if (isOnline) return "Online";
    const lastSeen = lastSeenAtByUserId[targetUserId];
    if (!lastSeen) return "Offline";
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000));
    return `Offline ${minutes} phút trước`;
  };

  const handleCreateDirect = async () => {
    if (!selectUserId) return;
    const res = (await createDirectConversation({ targetUserId: selectUserId, workspaceId })) as any;
    if (res?.response?.id) {
      setActiveConversationId(res.response.id);
      setSelectUserId("");
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || !messageInput.trim()) return;
    socket.emit("message:send", { conversationId: activeConversationId, content: messageInput.trim() });
    socket.emit("typing:stop", { conversationId: activeConversationId });
    setMessageInput("");
  };

  const startPeer = async (isVideo: boolean, toUserId: string, conversationId: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", {
          toUserId,
          candidate: event.candidate,
          conversationId,
        });
      }
    };
    return pc;
  };

  const startCall = async (mode: "audio" | "video") => {
    if (!activeConversation) return;
    const other = getOtherUser(activeConversation);
    if (!other) return;

    setActiveCallUserId(other.id);
    socket.emit("call:invite", {
      conversationId: activeConversation.id,
      toUserId: other.id,
      mode,
    });

    const pc = await startPeer(mode === "video", other.id, activeConversation.id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("webrtc:offer", {
      toUserId: other.id,
      offer,
      conversationId: activeConversation.id,
      mode,
    });
  };

  const endCall = () => {
    if (activeConversationId && activeCallUserId) {
      socket.emit("call:end", { conversationId: activeConversationId, toUserId: activeCallUserId });
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setActiveCallUserId(null);
    setIsIncomingCall(false);
    setIncomingFromUserId(null);
  };

  useEffect(() => {
    const socketInstance = getChatSocket();
    const onIncomingCall = (payload: { fromUserId: string; mode: "audio" | "video" }) => {
      setIncomingFromUserId(payload.fromUserId);
      setIncomingMode(payload.mode);
      setIsIncomingCall(true);
    };

    const onOffer = async (payload: {
      fromUserId: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
      mode?: "audio" | "video";
    }) => {
      try {
        const useVideo = payload.mode === "video";
        const pc = await startPeer(useVideo, payload.fromUserId, payload.conversationId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketInstance.emit("webrtc:answer", {
          toUserId: payload.fromUserId,
          answer,
          conversationId: payload.conversationId,
        });
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    };

    const onAnswer = async (payload: { answer: RTCSessionDescriptionInit }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
    };

    const onIce = async (payload: { candidate: RTCIceCandidateInit }) => {
      if (!peerRef.current) return;
      await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    };

    const onCallEnded = () => endCall();

    socketInstance.on("call:incoming", onIncomingCall);
    socketInstance.on("webrtc:offer", onOffer);
    socketInstance.on("webrtc:answer", onAnswer);
    socketInstance.on("webrtc:ice-candidate", onIce);
    socketInstance.on("call:ended", onCallEnded);

    return () => {
      socketInstance.off("call:incoming", onIncomingCall);
      socketInstance.off("webrtc:offer", onOffer);
      socketInstance.off("webrtc:answer", onAnswer);
      socketInstance.off("webrtc:ice-candidate", onIce);
      socketInstance.off("call:ended", onCallEnded);
    };
  }, [incomingMode]);

  return (
    <div className="h-full rounded-lg border overflow-hidden bg-white">
      <div className="grid grid-cols-12 h-full">
        <div className="col-span-4 border-r p-3">
          <h2 className="font-semibold text-lg">Tin nhắn</h2>
          <div className="flex gap-2 mt-3">
            <select
              className="border rounded px-2 py-1 text-sm flex-1"
              value={selectUserId}
              onChange={(e) => setSelectUserId(e.target.value)}
            >
              <option value="">Chọn user để chat riêng...</option>
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
            </select>
            <Button size="sm" onClick={handleCreateDirect} disabled={!selectUserId}>
              Tạo
            </Button>
          </div>
          <Separator className="my-3" />
          <ScrollArea className="h-[calc(100%-96px)]">
            <div className="space-y-2 pr-2">
              {conversations.map((conversation) => {
                const other = getOtherUser(conversation);
                const isOnline = other ? onlineUserIds.includes(other.id) : false;
                const presenceText =
                  conversation.type === "direct"
                    ? getPresenceText(other?.id)
                    : isOnline
                      ? "Online"
                      : "Offline";
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full text-left p-2 rounded border ${
                      activeConversationId === conversation.id ? "bg-blue-50 border-blue-200" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{getConversationTitle(conversation)}</span>
                      {!!conversation.unreadCount && <Badge variant="destructive">{conversation.unreadCount}</Badge>}
                    </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate max-w-[220px]">
                      {conversation.lastMessage?.content || "Chưa có tin nhắn"}
                    </div>
                    {conversation.type === "direct" && (
                      <div className="mt-1">
                        <Badge variant={isOnline ? "default" : "outline"}>{presenceText}</Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="col-span-8 flex flex-col h-full">
          {activeConversation ? (
            <>
              <div className="border-b p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{getConversationTitle(activeConversation)}</p>
                  <p className="text-xs text-muted-foreground">
                    {typingUserIds.length > 0
                      ? "Đang nhập..."
                      : activeConversation.type === "direct"
                        ? getPresenceText(getOtherUser(activeConversation)?.id)
                        : "Sẵn sàng trò chuyện"}
                  </p>
                </div>
                {activeConversation.type === "direct" && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => startCall("audio")}>
                      <Phone className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => startCall("video")}>
                      <Video className="size-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isIncomingCall && (
                <div className="p-3 bg-amber-50 border-b flex items-center justify-between">
                  <p className="text-sm">
                    Cuộc gọi {incomingMode === "video" ? "video" : "thoại"} đến từ user {incomingFromUserId}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (incomingFromUserId && activeConversationId) {
                          socket.emit("call:accept", {
                            conversationId: activeConversationId,
                            toUserId: incomingFromUserId,
                          });
                          setActiveCallUserId(incomingFromUserId);
                          setIsIncomingCall(false);
                        }
                      }}
                    >
                      Nhận
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (incomingFromUserId && activeConversationId) {
                          socket.emit("call:reject", {
                            conversationId: activeConversationId,
                            toUserId: incomingFromUserId,
                          });
                        }
                        setIsIncomingCall(false);
                      }}
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              )}

              {activeCallUserId && (
                <div className="p-3 border-b bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Đang trong cuộc gọi</span>
                    <Button variant="destructive" size="sm" onClick={endCall}>
                      Kết thúc
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded bg-black h-36" />
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded bg-black h-36" />
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 pb-2">
                  {messages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                            mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          {!mine && (
                            <div className="text-[11px] opacity-70 mb-1">{message.sender?.username || "Unknown"}</div>
                          )}
                          <div>{message.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-3 border-t flex gap-2 bg-white">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    if (activeConversationId) {
                      socket.emit("typing:start", { conversationId: activeConversationId });
                    }
                  }}
                  onBlur={() => {
                    if (activeConversationId) socket.emit("typing:stop", { conversationId: activeConversationId });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  Gửi
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">Chọn hội thoại để bắt đầu</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
