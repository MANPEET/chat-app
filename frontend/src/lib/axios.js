import axios from "axios"

const BASE_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:3000" 
    : "https://chat-app-2-tgg1.onrender.com"

export const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: false, 
})


axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})