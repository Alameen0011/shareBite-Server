import { Document, Types } from "mongoose";

export interface IDonation extends Document {
  donor: Types.ObjectId;
  type: "perishable" | "non-perishable" | "cooked";
  quantity: number;
  expiry?: Date;
  pickupLocation: ILocation;
  image: string;
  status:
    | "canceled"
    | "pending"
    | "claimed"
    | "picked_up"
    | "delivered_to_kiosk"
    | "available_for_distribution"
    | "distributed"
    | "discarded";
  volunteer?: Types.ObjectId | null;
  kiosk?: Types.ObjectId | null;
  claimedAt?:Date;
  pickedUpAt?:Date;
  deliveredAt?:Date
  createdAt?: Date;
  updatedAt?: Date;
}

 interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
}
