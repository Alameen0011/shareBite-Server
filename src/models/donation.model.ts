import mongoose from "mongoose";
import { IDonation } from "../interfaces/donation";

const DonationSchema = new mongoose.Schema<IDonation>(
    {
      donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["perishable", "non-perishable", "cooked"],
      },
      quantity: {
        type: Number,
        required: true,
      },
      expiry: {
        type: Date,
        required: function () {
          return (this as IDonation).type !== "non-perishable";
        },
      },
      pickupLocation: {
        type: {
          type: String,
          enum: ["Point"], // GeoJSON type
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
        address: {
          type: String, // Optional: Store human-readable address
          required: true,
        },
      },
      image: {
        type: String, // Cloudinary image URL
        required: true, // Ensure every donation has an image
      },
      status: {
        type: String,
        enum: [
          "canceled",
          "pending",
          "claimed",
          "picked_up",
          "delivered_to_kiosk",
          "available_for_distribution",
          "distributed",
          "discarded",
        ],
        default: "pending",
      },
      volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      kiosk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kiosk",
        default: null,
      },
    },
    { timestamps: true }
  );
  
const Donation = mongoose.model<IDonation>("Donation", DonationSchema);

export default Donation
  