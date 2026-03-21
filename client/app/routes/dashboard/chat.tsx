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
import { MoreHorizontal, Pin, Pencil, Trash2 } from "lucide-react";
import type { Conversation, User } from "@/type";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messageScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      if (aTime === bTime) return a.id.localeCompare(b.id);
      return aTime - bTime;
    });
  }, [messages]);
  const pinnedMessages = useMemo(
    () =>
      sortedMessages
        .filter((m) => m.is_pinned)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [sortedMessages]
  );
  const latestPinnedMessage = pinnedMessages[0] || null;

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

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [activeConversationId]);

  const scrollMessagesToBottom = () => {
    const container = messageScrollContainerRef.current;
    const viewport = container?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
      return;
    }
    messageEndRef.current?.scrollIntoView({ block: "end" });
  };

  useEffect(() => {
    if (!activeConversationId || !shouldAutoScrollRef.current) return;
    if (sortedMessages.length === 0) return;
    const frame = requestAnimationFrame(() => {
      scrollMessagesToBottom();
      setTimeout(scrollMessagesToBottom, 0);
      setTimeout(scrollMessagesToBottom, 120);
      shouldAutoScrollRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeConversationId, sortedMessages.length]);

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
    shouldAutoScrollRef.current = true;
    socket.emit("message:send", { conversationId: activeConversationId, content: messageInput.trim() });
    socket.emit("typing:stop", { conversationId: activeConversationId });
    setMessageInput("");
  };

  const handleStartEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingText(content);
  };

  const handleSaveEditMessage = () => {
    if (!activeConversationId || !editingMessageId || !editingText.trim()) return;
    socket.emit("message:edit", {
      conversationId: activeConversationId,
      messageId: editingMessageId,
      content: editingText.trim(),
    });
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeConversationId) return;
    socket.emit("message:delete", {
      conversationId: activeConversationId,
      messageId,
    });
  };

  const handleTogglePinMessage = (messageId: string, nextPinned: boolean) => {
    if (!activeConversationId) return;
    socket.emit("message:pin", {
      conversationId: activeConversationId,
      messageId,
      isPinned: nextPinned,
    });
  };

  const focusMessageById = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedMessageId(messageId);
    setShowPinnedPanel(false);
    setTimeout(() => {
      setFocusedMessageId((prev) => (prev === messageId ? null : prev));
    }, 1800);
  };

  const formatMessageTime = (iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div className="grid grid-cols-12 h-full min-h-0">
        <div className="col-span-4 border-r p-3 min-h-0">
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

        <div className="col-span-8 flex flex-col h-full min-h-0">
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

              {pinnedMessages.length > 0 && latestPinnedMessage && (
                <div className="border-b bg-amber-50/60 px-3 py-2">
                  <button
                    className="w-full flex items-center justify-between gap-3 text-left"
                    onClick={() => setShowPinnedPanel((prev) => !prev)}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        <Pin className="size-3.5" />
                        Tin nhắn đã ghim ({pinnedMessages.length})
                      </p>
                      <p className="text-xs text-slate-700 truncate mt-1">
                        {latestPinnedMessage.sender?.username || "User"}: {latestPinnedMessage.content}
                      </p>
                    </div>
                    <Badge variant="outline">{showPinnedPanel ? "Ẩn" : "Xem"}</Badge>
                  </button>

                  {showPinnedPanel && (
                    <div className="mt-2 rounded border border-amber-200 bg-white max-h-52 overflow-y-auto">
                      {pinnedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="px-3 py-2 border-b last:border-b-0 hover:bg-amber-50/60"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button className="min-w-0 text-left flex-1" onClick={() => focusMessageById(msg.id)}>
                              <p className="text-[11px] text-slate-500 truncate">
                                {msg.sender?.username || "User"} · {formatMessageTime(msg.createdAt)}
                              </p>
                              <p className="text-xs text-slate-800 truncate">{msg.content}</p>
                            </button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs shrink-0"
                              onClick={() => handleTogglePinMessage(msg.id, false)}
                            >
                              Bỏ ghim
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

              <div ref={messageScrollContainerRef} className="flex-1 min-h-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3 pb-2">
                  {sortedMessages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    const isEditing = editingMessageId === message.id;
                    return (
                      <div
                        key={message.id}
                        ref={(el) => {
                          messageRefs.current[message.id] = el;
                        }}
                        className={`flex group ${mine ? "justify-end" : "justify-start"} ${
                          focusedMessageId === message.id ? "ring-2 ring-amber-300 rounded-md" : ""
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                            mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          {!mine && (
                            <div className="text-[11px] opacity-70 mb-1">{message.sender?.username || "Unknown"}</div>
                          )}
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="bg-white text-slate-900 h-8"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white text-slate-900 hover:bg-slate-100"
                                  onClick={() => setEditingMessageId(null)}
                                >
                                  Hủy
                                </Button>
                                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={handleSaveEditMessage}>
                                  Lưu
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>{message.content}</div>
                          )}
                          <div className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-slate-500"}`}>
                            {formatMessageTime(message.createdAt)}
                            {message.edited_at ? " · đã chỉnh sửa" : ""}
                            {message.is_pinned ? " · đã ghim" : ""}
                          </div>
                        </div>
                        {!isEditing ? (
                          <div className="ml-2 self-start opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {mine ? (
                                  <DropdownMenuItem onClick={() => handleStartEditMessage(message.id, message.content)}>
                                    <Pencil className="size-4 mr-2" /> Chỉnh sửa
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  onClick={() => handleTogglePinMessage(message.id, !message.is_pinned)}
                                >
                                  <Pin className="size-4 mr-2" /> {message.is_pinned ? "Bỏ ghim" : "Ghim"}
                                </DropdownMenuItem>
                                {mine ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="size-4 mr-2" /> Xóa
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="p-3 border-t flex gap-2 bg-white min-w-0">
                <Input
                  className="flex-1 min-w-0"
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
                <Button className="shrink-0 min-w-16" onClick={handleSendMessage} disabled={!messageInput.trim()}>
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
