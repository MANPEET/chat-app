import { useEffect, useState } from 'react'
import { useAuthStore } from "./store/useAuthStore.js"
import { Loader } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {SignUpPage}  from './pages/signUpPage.jsx'
import {LoginPage}  from './pages/LoginPage.jsx'
import  HomePage  from './pages/HomePage.jsx'


import "./index.css"
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import useChatStore from './store/useChatStore.js'

function App() {

  const {authUser,checkAuth,isCheckingAuth,onlineUsers,socket} = useAuthStore()


  useEffect(() =>{
    checkAuth()
  },[checkAuth])

  useEffect(() => {
    if (!socket) return;

    // ✅ wait for socket to actually connect before subscribing
    if (socket.connected) {
        useChatStore.getState().subscribeToMessages()
    } else {
        socket.on("connect", () => {
            useChatStore.getState().subscribeToMessages()
        })
    }

    return () => {
        socket.off("connect")
    }
}, [socket])


  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-red-400" />
      </div>
    );
 
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login"/>}></Route>
        <Route path='/signup' element={!authUser ? <SignUpPage /> :<Navigate to="/"/> }></Route>
        <Route path='/login' element={!authUser ? <LoginPage /> :<Navigate to="/"/>}></Route>
        <Route path='/profile' element={authUser ? <ProfilePage /> :<Navigate to="/login"/>}></Route>
      </Routes>

      <Toaster/>
    </div>
  )
}

export default App
