import { NextFunction, Request, Response } from "express";
import config from "../../config/env"
import { generateToken04 } from "../../utils/Zego/zegoServerAssistant";


const appID = config.APPID_ZEGOCLOUD
const secret = config.SERVER_SECRET_ZEGOCLOUD

//our zego ui kit need token to create a session and on vedio call, we have to pass appid, seerverSecret, userId-unique id we send from clinet to generate token


export const zegoToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const roomID = req.query.roomID as string;
        const userID = req.query.userID as string;
        const effectiveTimeInSeconds = 3600

        if (!roomID || !userID ) {
             res.status(400).json({ error: "Missing required query parameters" });
             return;
          }

      //"guest-2874949932010348" - userID
  
      if (!userID || typeof userID !== 'string') {
         res.status(400).json({ error: 'userID is required and must be a string' });
         return;
      }

      if (!secret) {
         res.status(500).json({ error: 'Zego secret is not configured' });
         return
      }

      const payload = JSON.stringify({ roomID });
  
      const token = generateToken04(Number(appID),userID,secret,effectiveTimeInSeconds,payload);


      res.json({ token });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };