import jwt from "jsonwebtoken"

export const generateTokenAndSetCookie = (userId,res) => {
    const Token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn: '15d'
    })

    res.cookie("token",Token,{
        sameSite:"strict",
        httpOnly: true,
        maxAge: 15 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV !== "development"
    })

    return Token
}