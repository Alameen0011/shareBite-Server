import { NextFunction, Response } from "express";
import { AuthRequest } from "../../interfaces/auth";
import Donation from "../../models/donation.model";
import { getDistanceFromLatLonInKm } from "../../utils/harvasine";
import { generateOtp } from "../../utils/otp";
import mongoose from "mongoose";
import { getIndividualSocketId } from "../../sockets";
import Kiosk from "../../models/kiosk.model";

interface Kiosk {
  _id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  distance?: number; 
}

export const getAvailableDonations = async ( req: AuthRequest, res: Response, next: NextFunction) => {

  try {

    const { lat, lng, radius = 5 } = req.query; //radius in km

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: "latitude and longitude required",
      });
      return;
    }

    const center = [parseFloat(lng as string), parseFloat(lat as string)];

    const donations = await Donation.find({
      status: "pending",
      volunteer: null,
      pickupLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: center,
          },
          $maxDistance: parseFloat(radius as string) * 1000, //km to meter
        },
      },
    }).populate("donor", "name email");

    res.status(200).json({
      success: true,
      donations,
    });
  } catch (error) {
    console.error("GeoQuery Error:", error);
    next(error);
  }
};

export const claimDonation = async ( req: AuthRequest, res: Response, next: NextFunction) => {

  try {
    const io = req.app.get("io")

    const donationId = req.params.id;
    const volunteerId = req.user?.id;


    // Atomic update (avoids race conditions)
    const donation = await Donation.findOneAndUpdate(
      {
        _id: donationId,
        status: "pending",
        volunteer: null, // ensure not claimed
      },
      {
        $set: {
          volunteer: volunteerId,
          status: "claimed",
          claimedAt: new Date(),
        },
      },
      {
        new: true, // return updated doc
      }
    ).populate("donor", "name email")

    if (!donation) {
      res.status(400).json({
        success: false,
        message: "Donation already claimed or invalid",
      });
      return;
    }

    // 🎯 Real-time update to notify others
    io.emit("donationClaimed", {
      donationId,
      claimedBy: volunteerId,
    });

    res.status(200).json({
      success: true,
      message: "Donation claimed successfully",
      donation,
    });
  } catch (error) {
    console.error("Error in claimDonation:", error);
    next(error);
  }
};

export const verifyAndPickup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    const io = req.app.get("io")
    const donationId = req.params.id;
    const volunteerId = req.user?.id;
    const { otp } = req.body;



    const donation = await Donation.findById(donationId);

    if (!donation) {
      res.status(400).json({ success: false, message: "Donation not found" });
      return;
    }

    if (donation.otpUsed) {
      res
        .status(400)
        .json({ success: false, message: "OTP has already been used" });
      return;
    }

    if (donation.otp !== otp) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    // Verify volunteer and current status
    if (
      !donation.volunteer ||
      donation.volunteer.toString() !== volunteerId ||
      donation.status !== "claimed"
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to pick this donation",
      });
      return;
    }

    // All checks passed
    donation.otpUsed = true;
    donation.status = "picked_up";
    donation.pickedUpAt = new Date();
    await donation.save();


    //realtime feature - toast to donor on pickup
    const socketId = getIndividualSocketId(donation.donor.toString())

    if(socketId) io.to(socketId).emit("donationPickedUp", { donationId, volunteerId });

    res.status(200).json({
      success: true,
      message: "OTP verified and donation picked up",
      donation,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyAndDeliver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const io = req.app.get("io")
    const donationId = req.params.id;
    const volunteerId = req.user?.id;
    const { otp } = req.body;


    const donation = await Donation.findById(donationId);


    if (!donation) {
      res.status(400).json({ success: false, message: "Donation not found" });
      return;
    }

    if (donation.deliveryOtpUsed) {
      res.status(400).json({ success: false, message: "OTP has already been used" });
      return;
    }

    if (donation.deliveryOtp !== otp) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    // Verify volunteer and current status
    if (!donation.volunteer || donation.volunteer.toString() !== volunteerId || donation.status !== "picked_up") {
      res.status(403).json({
        success: false,
        message: "Not authorized to deliver this donation",
      });
      return;
    }

    donation.deliveryOtpUsed = true;
    donation.status = "delivered_to_kiosk";
    donation.deliveredAt = new Date();
    await donation.save();

     //realtime feature - toast to donor on delivery
    const socketId = getIndividualSocketId(donation.donor.toString())
 
    if(socketId) io.to(socketId).emit("donationDelivery", { donationId, volunteerId });



    res.status(200).json({
      success: true,
      message: "Delivered successfully",
      donation,
    });
  } catch (error) {
    console.error("Delivery Error:", error);
    next(error);
  }
};

export const nearestKiosk = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;
    const { id } = req.params;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        message: "missing lat and lng",
      });
      return;
    }

    const FromLat = parseFloat(lat as string);
    const FromLng = parseFloat(lng as string);


    const kiosksNearby = await Kiosk.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [ FromLng, FromLat,], // [longitude, latitude]
          },
          $maxDistance: 5000, // Maximum distance in meters (5 km)
        },
      },
    }).limit(1)


    if (kiosksNearby.length === 0) {
      res.status(404).json({
        success: false,
        message: "No kiosks found nearby",
      })
      return;
    }

    const donation = await Donation.findById(id);

    if (!donation) {
     res.status(404).json({ success: false, message: "Donation not found" });
     return ;
    }


    const nearestKiosk = kiosksNearby[0];
    const distance = getDistanceFromLatLonInKm(
      FromLat,
      FromLng,
      nearestKiosk.location.coordinates[1],
      nearestKiosk.location.coordinates[0]
    ).toFixed(2);

    donation.kiosk = new mongoose.Types.ObjectId(nearestKiosk._id);
    if(!donation.deliveryOtp){
      donation.deliveryOtp = generateOtp(6);
    }
    await donation.save();
    

    res.status(200).json({
      success: true,
      data:nearestKiosk,
      distance,
    });
  } catch (error) {
    console.error("Kiosk Error:", error);
    next(error);
  }
};
