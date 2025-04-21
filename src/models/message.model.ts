import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
       type: Schema.Types.ObjectId,
        ref: 'User',
         required: true },
    receiverId: {
       type: Schema.Types.ObjectId,
        ref: 'User',
         required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);