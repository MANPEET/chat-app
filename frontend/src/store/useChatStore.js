import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set,get) => ({
    messages:[],
    users:[],
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

            // If backend doesn't return a populated sender, manually attach authUser
            // so audio/image messages render immediately without needing a refresh
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

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;

        socket.off("newMessage")
        socket.off("newGroupMessage")
        socket.off("messageDelivered")

        socket.on("newMessage", (message) => {
            const authUser = useAuthStore.getState().authUser
            const selectedUsers = get().selectedUsers

            if (message.sender._id === authUser._id) return
            if (message.sender._id !== selectedUsers._id) return

            set((state) => ({
                messages: [...state.messages, message],
            }));
        });

        socket.on("newGroupMessage", (message) => {
            const selectedUsers = get().selectedUsers;

            if (String(selectedUsers?._id) === String(message.group)) {
                set((state) => ({
                    messages: [...state.messages, message],
                }));
            }
        });

        socket.on("messageDelivered", ({messageId}) => {
            set((state) => ({
                messages: state.messages.map((msg) => {
                    msg._id === messageId ? {...msg, isDelivered: true} : msg
                })
            }))
        })
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        socket.off("newMessage")
        socket.off("newGroupMessage")
    },

    setSelectedUsers: (selectedUsers) => set({selectedUsers}),
    setIsTyping: (isTyping) => set({isTyping}),
    setGroupScreenLoaded: (groupScreenLoaded) => set({groupScreenLoaded})
}))

export default useChatStore