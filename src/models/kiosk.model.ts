import mongoose, { Document,  Schema, Types } from "mongoose";

// Kiosk interface
interface IKiosk extends Document {
  _id: Types.ObjectId;
  name: string;
  location: {
    type: string; // "Point"
    coordinates: [number, number];
    address: string;
  };
  distance?:number
}

const kioskSchema = new Schema<IKiosk>({
  name: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    address: {
      type: String, // Optional: Store human-readable address
      required: true,
    },
  },
});

const Kiosk = mongoose.model<IKiosk>("Kiosk", kioskSchema);

export default Kiosk;
