import  { Document } from "mongoose";


export interface DecodedToken {
    id: string;
    role: string;
    iat: number;
    exp: number;
  }


export interface IMagicToken extends Document {
    email: string;
    token: string;
    role: string;
    expiresAt: Date;
  }

