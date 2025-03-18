import { Request } from "express";
import mongoose, { Document, Schema, Model } from "mongoose";


export interface DecodedToken {
    id: string;
    role: string;
    iat: number;
    exp: number;
  }

export interface AuthRequest extends Request {
    user?: { id: string, role: string };
}

export interface IMagicToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
  }

