import User from "../models/userSchema.js"
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js"
import cloudinary from "../lib/cloudinary.js"

export const signUp = async(req,res) => {
    try {
        const {email,password,fullName} = req.body

        if(!email || !password || !fullName){
            return res.status(400).json({message:"All fields are required"})
        }

        if(password.length < 6){
            return res.status(400).json({message: 'Password must be atleast 6 characters'})
        }

        const user = await User.findOne({email})

        if(user){
            return res.status(400).json({message: "User Already Exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            email: email,
            password: hashedPassword,
            fullName:fullName
            
        })

        if(newUser){
            generateTokenAndSetCookie(newUser._id,res)
            await newUser.save()

            res.status(201).json({
                _id: newUser._id,
                email:newUser.email,
                fullName: newUser.fullName
            })
        }
        else{
            res.status(400).json({message: "Invalid User Data"})
        }
    } catch (error) {
        console.log(error)
    }
}



export const login = async(req,res) =>{
    try {
        const {email,password} = req.body

        if(!email || !password){
            return res.status(400).json({message: "All fields are required"})
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message: "No user found"})
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password)

        if(!isPasswordCorrect){
            return res.status(400).json({message: "Password is incorrect"})
        }

        generateTokenAndSetCookie(user._id,res)

        return res.status(200).json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            profilePic: user.profilePic
        })
    } catch (error) {
        res.status(500).json({message: error.message})
        console.log(`Error in Login: ${error.message}`)
    }
}

export const logout = (req,res) =>{
    try{
        res.cookie("token","",{maxAge: 0})
        res.status(200).json({messgae: "User logged out successfully"})
    }
    catch(error){
        res.status(500).json({message: error.message})
        console.log(`Error in Login: ${error.message}`)
    }
}

export const updateProfile = async(req,res) =>{
    try{
        const {profilePic} = req.body

        const userId = req.user._id

        if(!profilePic){
            return res.status(400).json({message: "Profile Picture is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url},{new: true})
        //{new: true} ensures to return the updatedUser

        return res.status(200).json(updatedUser)
    }
    catch(error){
        return res.status(401).json({message:`Error in Updating profile: ${error}`})
    }
}

export const checkAuth = (req,res) =>{
    try{
        return res.status(201).json(req.user)
    }
    catch(error){
        console.log("Error in check auth controller:",error.message)
        return res.status(500).json({message:"Internal server Error"})
    }
}

