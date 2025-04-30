import { AuthRequest  } from "../../interfaces/auth";
import Donation from "../../models/donation.model";
import Kiosk from "../../models/kiosk.model";
import User from "../../models/user.model";
import { Response } from "express";





export const getAdminDashboardOverview = async (_req:AuthRequest,res:Response) => {

    const totalDonations = await Donation.countDocuments();
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalKiosks = await Kiosk.countDocuments();
    const trend = await Donation.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

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
      totalDonations,
      totalVolunteers,
      totalDonors,
      totalKiosks,
      topDonors,
      topVolunteers,
      trend

    })

  }

