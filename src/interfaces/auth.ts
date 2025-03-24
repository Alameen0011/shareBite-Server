import { Request } from "express";
import  { Document } from "mongoose";


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
    email: string;
    token: string;
    role: string;
    expiresAt: Date;
  }

