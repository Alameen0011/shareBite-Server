import { AuthRequest } from "../../interfaces/auth"
import { NextFunction, Response } from "express"
import User from "../../models/user.model";

export const updateProfile = async (req: AuthRequest,res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const {name, phone, address} = req.body
     try {
        const updatedUser = await User.findByIdAndUpdate(userId,{ name,phone,address }, {new:true})

        if(!updatedUser){
            res.status(400).json({
                success: false,
                message:"cannot update user"
            })
            return;
        }

        res.status(200).json({
            success:true,
            user:updatedUser,
            message:"profile added successfully"
        })

        
     } catch (error) {
        console.log("Update Profile Error:",error),
        next(error)
     }

}

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id

        const user = await User.findById(userId)

        if(!user){
            res.status(404).json({
                success:false,
                message:"cannot find user"
            })
        }

        res.status(200).json({
            success:true,
            user,
            message:"profile founded successfully"
        })
        
    } catch (error) {
        console.log("Get Profile Error:",error),
        next(error)
    }
}
