import { Document,ObjectId,Types } from "mongoose";

export interface IUser extends Document {
    _id: ObjectId;
    name? : string;
    email : string;
    role  : "donor" | "volunteer" | "kiosk_manager" | "admin";
    phone?: string;
    address?: string;
    isBlocked: boolean;
    donations?: Types.ObjectId[];
    kioskId?: Types.ObjectId | null;
    oauthProvider: "google" | "facebook" | "none";
    createdAt: Date;
    updatedAt: Date;
}