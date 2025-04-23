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


  export const getTopDonors = async (_req: AuthRequest, res: Response) => {

   const topDonors = await Donation.aggregate([
    { $match: { status: "delivered_to_kiosk" } },
    {
      $group: {
        _id: "$donor",
        donationsCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "donorInfo"
      }
    },
    { $unwind: "$donorInfo" },
    {
      $project: {
        name: "$donorInfo.name",
        donationsCount: 1
      }
    },
    { $sort: { donationsCount: -1 } },
    { $limit: 5 }
  ])

    res.status(200).json({
      success:true,
      topDonors
    })




  }


  export const getTopVolunteers = async (_req: AuthRequest, res: Response) => {
    
    const topVolunteers = await Donation.aggregate([
      { $match: { status: "delivered_to_kiosk" } },
      {
        $group: {
          _id: "$volunteer",
          pickupsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "volunteerInfo"
        }
      },
      { $unwind: "$volunteerInfo" },
      {
        $project: {
          name: "$volunteerInfo.name",
          pickupsCount: 1
        }
      },
      { $sort: { pickupsCount: -1 } },
      { $limit: 5 }

    ])

      res.status(200).json({
        success:true,
        topVolunteers,
      })

  }