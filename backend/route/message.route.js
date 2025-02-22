import express from "express"

import { protectedRoute } from "../middleware/protectedRoute.js"
import {getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js"

const messageRouter = express.Router()

messageRouter.get("/users",protectedRoute,getUsersForSidebar)
messageRouter.get("/:id",protectedRoute,getMessages)
messageRouter.post("/send/:id",protectedRoute,sendMessage)



export default messageRouter 