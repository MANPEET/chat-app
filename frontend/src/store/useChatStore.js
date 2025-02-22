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

    

    getMessages: async(id) =>{
        set({isMessagesLoading:true})
        try {
            const res = await axiosInstance.get(`/messages/${id}`)
            set({messages: res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        }
        finally{
            set({isMessagesLoading : false})
        }
    },

    sendMessage: async (messageData) => {
      const { selectedUsers, messages } = get();
      try {
        const res = await axiosInstance.post(`/messages/send/${selectedUsers._id}`, messageData);
        set({ messages: [...messages, res.data]});
      } catch (error) {
        console.error(error)
        toast.error(error.response.data.message);
      }
    },

    subscribeToMessages: () =>{
      const {selectedUsers} = get()

      if(!selectedUsers) return

      const socket = useAuthStore.getState().socket

      socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser = newMessage.senderId === selectedUsers._id;
        if (!isMessageSentFromSelectedUser) return;
  
        set({
          messages: [...get().messages, newMessage],
        });
      });


    },

    unsubscribeFromMessages: () => {
      const socket = useAuthStore.getState().socket
      socket.off("newMessage")
    },

    setSelectedUsers: (selectedUsers) => set({selectedUsers}),

    setIsTyping: (isTyping) => set({isTyping}),

    setGroupScreenLoaded: (groupScreenLoaded) => set({groupScreenLoaded})
}))

export default useChatStore