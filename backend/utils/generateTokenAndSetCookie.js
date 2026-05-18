import jwt from "jsonwebtoken"

export const generateTokenAndSetCookie = (userId, res) => {
    const Token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '15d'
    })

    res.cookie("token", Token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 24 * 60 * 60 * 1000,
    })

    return Token
}