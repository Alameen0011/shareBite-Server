import { Socket } from "socket.io"
import config from "../config/env"
import jwt from "jsonwebtoken";
import { DecodedToken } from "../interfaces/auth";


export const socketAuth = (socket: Socket, next: (err?: Error) => void ) => {
    console.log("inside socket Auth middleware")
    const token = socket.handshake.auth.token;


    if(!token) {
         next(new Error("Authentication failed: Token missing"))
         return;
    }


    try {
        const decoded = jwt.verify(token,config.JWT_ACCESS_KEY) as DecodedToken



        socket.data.user = decoded;
        next();
        
    } catch (error) {
        console.error("Socket auth error :",error)
        next(new Error("Authentication failed: Invalid token"))
        return;
        
    }



    next();
}