import express from "express"
import router from "./route/auth.route.js"
import dotenv from "dotenv"
import { connectDB } from "./lib/connectDB.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import messageRouter from "./route/message.route.js"
import { app,server } from "./lib/socket.js"
import path from "path";
import groupRouter from "./route/group.route.js"


const PORT = 3000
const __dirname = path.resolve()
dotenv.config()

connectDB()


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://chat-app-2-tgg1.onrender.com",
            "https://chat-app-zg5h.vercel.app"
        ],
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use(cookieParser())

app.use("/api/auth", router)
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../../frontend", "dist", "index.html"));
    });
}



server.listen(PORT,()=>{
    console.log(`App is listening on Port: ${PORT}`)
})