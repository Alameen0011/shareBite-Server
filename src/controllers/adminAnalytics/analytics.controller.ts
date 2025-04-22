import { AuthRequest  } from "../../interfaces/auth";
import Donation from "../../models/donation.model";
import Kiosk from "../../models/kiosk.model";
import User from "../../models/user.model";
import { Response } from "express";

export const getTotalDonations = async (_req: AuthRequest, res: Response) => {
    const count = await Donation.countDocuments();
    res.status(200).json({
        success:true,
        total: count
     });
  };
  
  export const getTotalVolunteers = async  (_req: AuthRequest, res: Response) => {
    const count = await User.countDocuments({ role: 'volunteer' });
    res.status(200).json({
        success:true,
        total: count
     });
  };
  
  export const getTotalDonors = async  (_req: AuthRequest, res: Response) => {
    const count = await User.countDocuments({ role: 'donor' });
    res.status(200).json({
        success:true,
        total: count
     });
  };
  
  export const getTotalKiosks = async (_req: AuthRequest, res: Response) => {
    const count = await Kiosk.countDocuments();
    res.status(200).json({
        success:true,
        total: count
     });
  };
  
  export const getDonationTrend = async (_req: AuthRequest, res: Response) => {
    const trend = await Donation.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  
    res.status(200).json({
        success:true,
        trend
     });
  };