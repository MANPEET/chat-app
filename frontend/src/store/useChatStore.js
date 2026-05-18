import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { useAuthStore } from "./useAuthStore";
import useGroupStore from "./useGroupStore";

export const useChatStore = create((set,get) => ({
    messages:[],
    users:[],
    unreadMessages: {},
    isUsersLoading:false,
    isMessagesLoading: false,
    selectedUsers: null,
    isTyping:false,
    groupScreenLoaded: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async(id) => {
        set({isMessagesLoading:true})
        try {
            const res = await axiosInstance.get(`/messages/${id}`)
            set({messages: res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isMessagesLoading: false})
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUsers, messages } = get();
        const authUser = useAuthStore.getState().authUser;
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUsers._id}`, messageData);

            const populatedMessage = {
                ...res.data,
                sender: res.data.sender?._id
                    ? res.data.sender
                    : {
                        _id: authUser._id,
                        fullName: authUser.fullName,
                        profilePic: authUser.profilePic,
                    },
            };

            set({ messages: [...messages, populatedMessage] });
        } catch (error) {
            console.error(error)
            toast.error(error.response.data.message);
        }
    },

    getUnreadMessages: async (senderId) => {
        if (!senderId) return;
        try {
            const res = await axiosInstance.get(`/messages/unread-message/${senderId}`)
            set((state) => ({
                unreadMessages: {
                    ...state.unreadMessages, [senderId]: res.data.count
                }
            }))
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;

        socket.off("newMessage")
        socket.off("newGroupMessage")
        socket.off("messageDelivered")
        socket.off("messageRead")
        socket.off("groupMessageDelivered")
        socket.off("groupMessageRead")

        socket.on("newMessage", (message) => {
            const authUser = useAuthStore.getState().authUser
            const selectedUsers = get().selectedUsers

            if (message.sender._id === authUser._id) return

            if (String(message.sender._id) !== String(selectedUsers?._id)) {
                set((state) => ({
                    unreadMessages: {
                        ...state.unreadMessages, [message.sender._id]: (state.unreadMessages[message.sender._id] || 0) + 1
                    }
                }))
                return
            }

            set((state) => ({
                messages: [...state.messages, message],
            }));

            socket.emit("markMessageAsRead", { chatId: selectedUsers._id })
        });

        socket.on("newGroupMessage", (message) => {
            const selectedUsers = get().selectedUsers;

            if (String(selectedUsers?._id) === String(message.group)) {
                set((state) => {
                    const alreadyExists = state.messages.some(m => m._id === message._id);
                    if (alreadyExists) return state;
                    return { messages: [...state.messages, message] };
                });
            }
        });

        socket.on("messageDelivered", ({ messageId }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, isDelivered: true } : msg
                )
            }))
        })

        socket.on("messageRead", ({ messageId, readAt }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? { ...msg, readAt, isDelivered: true } : msg
                )
            }))
        })

        socket.on("groupMessageDelivered", ({ messageId, userId, at }) => {
            const applyUpdate = (attemptsLeft) => {
                const { messages } = get();
                const exists = messages.some(m => m._id === messageId);

                if (!exists && attemptsLeft > 0) {
                    setTimeout(() => applyUpdate(attemptsLeft - 1), 100);
                    return;
                }

                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId
                            ? {
                                ...msg,
                                isDelivered: true,
                                deliveredTo: [
                                    ...(msg.deliveredTo || []),
                                    { user: userId, at }
                                ]
                            }
                            : msg
                    )
                }));
            };

            applyUpdate(10);
        });

        socket.on("groupMessageRead", ({ messageId, readAt, userId }) => {
            const { selectedUsers } = get();
            const { getGroupMessage } = useGroupStore.getState(); // add this import at top
            
            if (selectedUsers?._id) {
                getGroupMessage(selectedUsers._id);
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        socket.off("newMessage")
        socket.off("newGroupMessage")
    },

    setSelectedUsers: (selectedUsers) => set((state) => ({
        selectedUsers,
        unreadMessages: {
            ...state.unreadMessages, [selectedUsers._id]: 0
        }
    })),
    setIsTyping: (isTyping) => set({ isTyping }),
    setGroupScreenLoaded: (groupScreenLoaded) => set({ groupScreenLoaded })
}))

export default useChatStore