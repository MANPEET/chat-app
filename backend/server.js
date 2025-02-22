import express from "express"
import router from "./route/auth.route.js"
import dotenv from "dotenv"
import { connectDB } from "./lib/connectDB.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import messageRouter from "./route/message.route.js"
import { app,server } from "./lib/socket.js"


const PORT = 3000
dotenv.config()

connectDB()



app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
);

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", router)
app.use("/api/messages", messageRouter)



server.listen(PORT,()=>{
    console.log(`App is listening on Port: ${PORT}`)
})