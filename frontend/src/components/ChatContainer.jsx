import { useEffect, useRef, useState } from "react"
import useChatStore from "../store/useChatStore"
import ChatHeader from "./ChatHeader"
import MessageInput from "./MessageInput"
import { useAuthStore } from "../store/useAuthStore"
import formatTimeMessage from "../lib/utils"
import useGroupStore from "../store/useGroupStore"
import AudioMessage from "./AudioMessage"
import TypingIndicator from "./TypingIndicator"
import { Check, CheckCheck } from "lucide-react"

const ChatContainer = () => {
    const { messages, getMessages, selectedUsers, isMessagesLoading, subscribeToMessages, unsubscribeFromMessages } = useChatStore()
    const { authUser, socket } = useAuthStore()
    const { groups, getGroupMessage } = useGroupStore()
    const [typingUsers, setTypingUsers] = useState([]);

    const messageEndRef = useRef()

    if (!authUser || !authUser._id) return null

    const isGroupChat = selectedUsers?.members

   useEffect(() => {
    if (!selectedUsers?._id) return;

    const loadAndSubscribe = async () => {
        if (selectedUsers.members) {
            await getGroupMessage(selectedUsers._id);
        } else {
            await getMessages(selectedUsers._id);
        }

        subscribeToMessages();

        setTimeout(async () => {
            if (socket) {
                if (isGroupChat) {
                    socket.emit("markGroupMessageAsRead", { groupId: selectedUsers._id });
                    await getGroupMessage(selectedUsers._id); // ✅ re-fetch after marking read
                } else {
                    socket.emit("markMessageAsRead", { chatId: selectedUsers._id });
                }
            }
        }, 300);
    }

    loadAndSubscribe();
    return () => unsubscribeFromMessages();
}, [selectedUsers?._id]);

    useEffect(() => {
        if (socket && groups.length > 0) {
            const groupIds = groups.map(g => g._id);
            socket.emit("joinGroups", groupIds);
        }
    }, [socket, groups]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, typingUsers])

    useEffect(() => {
        if (!socket) return;

        socket.on("userTyping", ({ userId, user }) => {
            setTypingUsers(prev => {
                if (prev.find(u => u._id === userId)) return prev;
                return [...prev, user];
            });
        });

        socket.on("userStoppedTyping", ({ userId }) => {
            setTypingUsers(prev => prev.filter(u => u._id !== userId));
        });

        return () => {
            socket.off("userTyping");
            socket.off("userStoppedTyping");
        };
    }, [socket]);

    useEffect(() => {
        setTypingUsers([]);
    }, [selectedUsers?._id]);

    const renderTicks = (message) => {
        const isMine = message.sender?._id === authUser._id;
        if (!isMine) return null;

        console.log("[RENDER]", message._id, "readBy:", message.readBy?.length)

        if (isGroupChat) {
            const totalMembers = (selectedUsers.members?.length || 1) - 1;

            const readByCount = (message.readBy || []).filter(
                r => r.user?.toString() !== authUser._id?.toString()
            ).length;

            const deliveredToCount = (message.deliveredTo || []).filter(
                d => d.user?.toString() !== authUser._id?.toString()
            ).length;

            if (totalMembers > 0 && readByCount >= totalMembers) {
                return <CheckCheck size={14} className="inline ml-3 text-blue-600" />
            } else if (totalMembers > 0 && deliveredToCount >= totalMembers) {
                return <CheckCheck size={14} className="inline ml-3 text-gray-400" />
            } else {
                return <Check size={14} className="inline ml-3 text-gray-400" />
            }
        } else {
            if (message.readAt) {
                return <CheckCheck size={14} className="inline ml-3 text-blue-600" />
            } else if (message.isDelivered) {
                return <CheckCheck size={14} className="inline ml-3 text-gray-400" />
            } else {
                return <Check size={14} className="inline ml-3 text-gray-400" />
            }
        }
    }

    return (
        <div className="flex flex-col overflow-auto flex-1 relative w-full">
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isMine = authUser?._id && message.sender?._id === authUser._id;

                    return (
                        <div
                            key={message._id}
                            className={`chat ${isMessagesLoading ? "animate-pulse" : ""} ${isMine ? "chat-end" : "chat-start"}`}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            isMine
                                                ? authUser.profilePic || "/avatar.png"
                                                : isGroupChat
                                                    ? message.sender?.profilePic || "/avatar.png"
                                                    : selectedUsers.profilePic || "/avatar.png"
                                        }
                                        alt="Profile Pic"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                {!isMine && (
                                    <span className="text-xs opacity-50 ml-1">~{message?.sender?.fullName}</span>
                                )}
                            </div>

                            <div className="chat-bubble flex flex-col">
                                {message.image && (
                                    <img
                                        src={message.image}
                                        alt="Attachment"
                                        className="sm:max-w-[200px] rounded-md mb-2"
                                    />
                                )}
                                {message.audio && (
                                    <AudioMessage src={message.audio} />
                                )}
                                {message.text && <p>{message.text}</p>}
                            </div>

                            <div className="chat-footer">
                                <time className="text-xs opacity-50 ml-1">{formatTimeMessage(message.createdAt)}</time>
                                {renderTicks(message)}
                            </div>
                        </div>
                    )
                })}
                <TypingIndicator typingUsers={typingUsers} isGroupChat={isGroupChat} />
                <div ref={messageEndRef} />
            </div>
            <MessageInput />
        </div>
    )
}

export default ChatContainer