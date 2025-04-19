import mongoose from "mongoose";
import { IDonation } from "../interfaces/donation";
import { generateOtp } from "../utils/otp";

const DonationSchema = new mongoose.Schema<IDonation>(
  {
    title: {
      type: String,
      required: true,
      default: null,
    },
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
      default: null,
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
      default: null,
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
      // ref: "Kiosk",
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    otp: {
      type: String,
    },
    otpUsed: {
       type: Boolean,
        default: false 
      },
      deliveryOtp: {
        type: String,
        default:null
      },
      deliveryOtpUsed:{
        type: Boolean,
        default: false,
      }
  },
  { timestamps: true }
);
DonationSchema.index({ pickupLocation: "2dsphere" });

DonationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.otp = generateOtp(6); // 🔑 6-digit OTP
   
  }
  next();
});

const Donation = mongoose.model<IDonation>("Donation", DonationSchema);

export default Donation;
