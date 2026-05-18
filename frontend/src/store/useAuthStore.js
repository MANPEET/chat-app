import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:3000" 
    : "https://chat-app-2-tgg1.onrender.com"

export const useAuthStore = create((set,get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    socket: null,
    onlineUsers: [],

    login: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/login", data)
            localStorage.setItem("token", res.data.token) 
            set({ authUser: res.data })
            get().connectSocket()
            toast.success("Logged in successfully")
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    signup: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/signup", data)
            localStorage.setItem("token", res.data.token) 
            set({ authUser: res.data })
            get().connectSocket()
            toast.success("Account created successfully")
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    logout: async () => {
    try {
        await axiosInstance.post("/auth/logout")
        localStorage.removeItem("token") 
        set({ authUser: null })
        get().disconnectSocket()
        toast.success("Logged out successfully")
    } catch (error) {
        toast.error(error.response.data.message)
    }
    },

    checkAuth: async () => {
    try {
        const token = localStorage.getItem("token")
        if (!token) {
            set({ authUser: null })
            return
        }
        const res = await axiosInstance.get("/auth/check")
        set({ authUser: res.data })
        get().connectSocket()
    } catch (error) {
        set({ authUser: null })
        localStorage.removeItem("token")
    } finally {
        set({ isCheckingAuth: false })
    }
    },

    updateProfile: async(profilePic) => {
        set({isUpdatingProfile: true})
        try{
            const res = await axiosInstance.put("/auth/update-profile",profilePic)
            set({authUser : res.data})
            toast.success("Profile Pice Uploaded")
        }
        catch(error){
            toast.error(error.response.data.message)
        }
        finally{
            set({isUpdatingProfile: false})
        }
    },

    connectSocket: () =>{
        const {authUser} = get()

        if(!authUser || get().socket?.connected) return

        const socket = io(BASE_URL,{
            query: {
                userId: authUser._id
            }
        })
        socket.connect()

        set({socket: socket})

        socket.on("getOnlineUsers" , (userId) =>{
            set({onlineUsers:userId })
        })
    },

    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect()
    }
}))

