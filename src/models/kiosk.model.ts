import mongoose, { Document, Schema } from "mongoose";

// Kiosk interface
interface IKiosk extends Document {
  name: string;
  location: {
    type: string; // "Point"
    coordinates: [number, number];
  };
}

const kioskSchema = new Schema<IKiosk>({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
});

const Kiosk = mongoose.model<IKiosk>("Kiosk", kioskSchema);

export default Kiosk;
