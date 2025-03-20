import jwt from "jsonwebtoken"
import config from "../config/env"


export const generateToken = (id :string, role:string, res : any) => {

    const token = jwt.sign({id,role},config.JWT_ACCESS_KEY,{expiresIn:"1d" });
    const refreshToken = jwt.sign({id,role},config.JWT_REFRESH_KEY,{expiresIn: "7d"})
    res.cookie("jwt",refreshToken,{
        maxAge:  24 * 60 * 60 * 1000,//MS
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", // prevent CSRF attacks
        secure: process.env.NODE_ENV !== "development" 
    })
    
    return token;
}