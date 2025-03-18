import { Response, NextFunction  } from "express"
import jwt from "jsonwebtoken"
import { AuthRequest , DecodedToken } from "../interfaces/auth";



export const protect  = async (req: AuthRequest , res: Response, next: NextFunction) => {
    let token: string | undefined;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token){
        res.status(401).json({
            success:false,
            message: "Not authorized, token missing"
        });
        return;
    }

    try {

        const decoded =  jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
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
        }
        next();

    }
   
    



}