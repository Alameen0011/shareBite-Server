import mongoose, { Model } from "mongoose";
import { IMagicToken } from "../interfaces/auth";

const magicTokenSchema = new mongoose.Schema <IMagicToken> ({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

const MagicTokenModel: Model<IMagicToken> = mongoose.model<IMagicToken>("MagicToken", magicTokenSchema);

export default MagicTokenModel
