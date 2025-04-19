import { NextFunction,Response } from "express"
import { AuthRequest } from "../../interfaces/auth"
import { Message } from "../../models/message.model"

export const getMessages = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const AdminId = req.user?.id
        const {id:UserToChatId} = req.params

        const messages = await Message.find({
            $or: [
                {senderId:AdminId,receiverId:UserToChatId},
                {senderId:UserToChatId,receiverId:AdminId}
            ]
        })



        res.status(200).json({
            success:true,
            messages
        });

        
    } catch (error) {
        console.error("Error :", error)
        next(error)
        
    }
}


export const sendMessage  = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const senderId = req.user?.id
        const {id:receiverId} = req.params
        const { text } = req.body;

        if(!text){
            res.status(400).json({
                success:false,
                message:"text is required"
            })
            return;
        }


        const newMessage = await Message.create({
            senderId,
            receiverId,
            text
        })

        res.status(201).json({
            success:true,
            message:"message successfully created",
            newMessage
        })



        
    } catch (error) {
        console.error("Error :", error)
        next(error)
    }



}