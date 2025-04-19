import { NextFunction, Response } from "express";
import { AuthRequest } from "../../interfaces/auth";
import { Message } from "../../models/message.model";
import { getIndividualSocketId } from "../../sockets";

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

    //realtime feature one to one messaging -one user posted a message and we will make the other guy aware of it at realtime
    const socketId = getIndividualSocketId(receiverId);

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
