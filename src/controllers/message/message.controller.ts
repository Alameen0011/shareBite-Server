import { NextFunction, Response } from "express";
import { AuthRequest } from "../../interfaces/auth";
import { Message } from "../../models/message.model";
import { getIndividualSocketId } from "../../sockets";
import User from "../../models/user.model";
import mongoose from "mongoose";

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id: UserToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: UserToChatId },
        { senderId: UserToChatId, receiverId: userId },
      ],
    });

    if (messages) {
      await Message.updateMany(
        {
            senderId: UserToChatId,
            receiverId: userId,
            read: false,
          },
          { $set: { read: true } }
      );
    }

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error :", error);
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const io = req.app.get("io");
    const senderId = req.user?.id;
    const { id: receiverId } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({
        success: false,
        message: "text is required",
      });
      return;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
    });

    console.log(newMessage, "Got the message Send")

    //realtime feature one to one messaging -one user posted a message and we will make the other guy aware of it at realtime
    const socketId = getIndividualSocketId(receiverId);

    console.log(socketId,"Sockeet IDD Message Send realtime ++++++++++++++++ ")

    if (socketId) io.to(socketId).emit("newMessage", newMessage);

    res.status(201).json({
      success: true,
      message: "message successfully created",
      newMessage,
    });
  } catch (error) {
    console.error("Error :", error);
    next(error);
  }
};

export const getUsersWhoMessagedAdmin =  async ( req: AuthRequest,res: Response, next: NextFunction) => {
  console.log("I am inisde the controller of get users messaged admin")
  try {
    const adminId = req.user?.id

    console.log("Inside get Users who messaged admin ===============", adminId)

    console.log("adminId passed to query:", adminId, typeof adminId);

    const adminObjectId = new mongoose.Types.ObjectId(adminId);

      // Step 1: Find all messages where admin is either sender or receiver
      const messages = await Message.find({
        $or: [
          { senderId: adminObjectId },
          { receiverId: adminObjectId }
        ]
      })
      .select('senderId receiverId')
      .lean()

      console.log(messages,"message, user ---> admin")


     // Step 2: Collect all unique user IDs who interacted with the admin
    const userIds = messages.reduce((acc: string[], message) => {
      // Add senderId and receiverId to the accumulator array if they're not the admin
      if (message.senderId.toString() !== adminId) acc.push(message.senderId.toString());
      if (message.receiverId.toString() !== adminId) acc.push(message.receiverId.toString());
      return acc;
    }, []);

    // Step 3: Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    console.log(uniqueUserIds,"user id contacted admin")

   // Step 4: Fetch user data for those who interacted with the admin
    const users = await User.find({ _id: { $in: uniqueUserIds } });


     res.status(200).json({
      success:true,
      users,
     });







    
  } catch (error) {
    console.error("Error :", error);
    next(error);    
  }

}
