import {Server} from "socket.io"
import express from "express"
import http from "http"
import { handleDelivery, handleTyping } from "../controllers/message.controller.js"
import User from "../models/userSchema.js"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin:["http://localhost:5173"]
    }
})

const userSocketMap = {}

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", async (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (!userId) return;

    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));


    const user = await User.findById(userId).select("fullName profilePic");
    if (!user) return;
    socket.user = { _id: user._id, fullName: user.fullName, profilePic: user.profilePic };

    socket.on("joinGroups", (groupIds) => {
        groupIds.forEach(groupId => {
            socket.join(groupId);
            console.log("Socket joined rooms:", groupIds);
        });
    });

    handleTyping(socket, io);

    handleDelivery(socket, io);

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server }