import mongoose from "mongoose";
import { IUser } from "../interfaces/user";

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["donor", "volunteer", "kiosk_manager", "admin"],
      default: "donor",  // Default role is "donor" instead of "user"
    },
    phone: {
      type: String,
      required: false, // Changed from required to optional
    },
    address: {
      type: String,
      required: false,
      default: null
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    donations: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Donation",
        },
      ],
      default: undefined, // Only appears if user is a donor
    },
    kioskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kiosk",
      default: null, // Only for kiosk managers
    },
    oauthProvider: {
      type: String,
      enum: ["google", "facebook", "none"],
      default: "none",
    },
  },
  { timestamps: true } // Handles createdAt & updatedAt automatically
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User
