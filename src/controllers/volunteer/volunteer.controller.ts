import { NextFunction, Response } from "express";
import { AuthRequest } from "../../interfaces/auth";
import Donation from "../../models/donation.model";

export const getAvailableDonations = async ( req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("hello there");
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

export const claimDonation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
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
          claimedAt: new Date()
        },
      },
      {
        new: true, // return updated doc
      }
    ).populate("donor", "name email");

    if (!donation) {
      res.status(400).json({
        success: false,
        message: "Donation already claimed or invalid",
      });
      return;
    }

    // 🎯 Real-time update to notify others
    // io.emit("donationClaimed", {
    //   donationId,
    //   claimedBy: volunteerId,
    // });

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

export const markAsPickedUp = async( req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const donationId = req.params.id
    const volunteerId = req.user?.id

    const donation = await Donation.findOneAndUpdate(
        {
            _id: donationId,
            volunteer:volunteerId,
            status: "claimed"
        },
        {
            $set: {
                status: "picked_up",
                pickedUpAt: new Date()
            }
        },
        { new : true }
);

    if(!donation){
        res.status(400).json({
            success: false,
            message: "Donation not found, or not claimable by you",
        });
    }

    //Emit socket Event
    /* io.emit( "donationPickedUp",
        { donationId, volunteerId }
            ) 
        */

    res.status(200).json({
        success:true,
        message: "Donation marked as picked up",
        donation,
    })



  } catch (error) {
    next(error);
  }
};

export const markAsDelivered = async( req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const donationId = req.params.id;
    const volunteerId = req.user?.id;

    const donation = await Donation.findOneAndUpdate(
        {
            _id: donationId,
            volunteer: volunteerId,
            status: "picked_up"
        },
        {
            $set: {
                status:"delivered_to_kiosk",
                deliveredAt: new Date()
            },
        },
        {
            new : true
        }
    )

    if(!donation){
        res.status(404).json({
            success:false,
            message: "Donation not found or already delivered, or not picked up by you.."
        });
    }

    res.status(200).json({
        success: true,
        message: "Donation marked as delivered to kiosk",
        donation,
    })



  } catch (error) {
    console.error("Delivery Error:", error);
    next(error);
  }
};
