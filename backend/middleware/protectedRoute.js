import jwt from "jsonwebtoken"
import User from "../models/userSchema.js"

export const protectedRoute = async(req,res,next) =>{
    try{
        const token = req.cookies.token

        if(!token){
            return res.status(400).json({message:"Unauthorized - no token provided"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(!decoded){
            return res.status(401).json({message:"Unauthorized - Invalid Token"})
        }

        const user = await User.findOne({ _id: decoded.userId }).select("-password")

        if(!user){
            return res.status(404).json({message:"No user Found!"})
        }

        req.user = user
        next()
    }
    catch(error){
        console.error(error)
    }
}