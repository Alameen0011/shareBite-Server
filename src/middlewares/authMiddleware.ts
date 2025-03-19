import config from "../config/env"
import { Response, NextFunction  } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest , DecodedToken } from "../interfaces/auth";



export const protect  = async (req: AuthRequest , res: Response, next: NextFunction) => {
    console.log("inside protect middleware")
    let token: string | undefined;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];

        console.log(token,"token")
    }

    if(!token){
        res.status(401).json({
            success:false,
            message: "Not authorized, token missing"
        });
        return;
    }

    try {

        const decoded =  jwt.verify(token, config.JWT_ACCESS_KEY!) as DecodedToken;
        console.log(decoded,"==========token decoded")
        req.user = { id: decoded.id, role: decoded.role };
        next();
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token"
        })
        
    }

    
}

export const authorizeRoles = (...allowedRoles:string[]) => {
    return (req: AuthRequest,res: Response, next: NextFunction) => {
        if(!req.user){
            res.status(401).json({
                success:false,
                message: "Not authorized"
            })
            return;
        }
    
        if(!allowedRoles.includes(req.user.role)){
            res.status(403).json({
                success:false,
                message: "Forbidden. You do not have accesss"
            })
            return;
        }
        next();

    }
   
    



}