import express from "express"

import { protectedRoute } from "../middleware/protectedRoute.js"
import {getMessages, getUnreadMessagesCount, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js"

const messageRouter = express.Router()

messageRouter.get("/users",protectedRoute,getUsersForSidebar)
messageRouter.get("/:id",protectedRoute,getMessages)
messageRouter.post("/send/:id",protectedRoute,sendMessage)
messageRouter.get("/unread-message/:senderId", protectedRoute, getUnreadMessagesCount)


export default messageRouter 