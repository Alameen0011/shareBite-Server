import { AuthRequest } from "../../interfaces/auth"
import { NextFunction, Response } from "express"
import Donation from "../../models/donation.model"
import { donationSchema, updateDonationSchema } from "../../validations/donationSchema";
import { notifyNearbyVolunteers } from "../../sockets/volunteer.socket";



export const createDonation = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const io = req.app.get("io")


        const validatedData = donationSchema.parse(req.body)



        console.log(validatedData,"data came to backend")

        const { title, type, quantity, expiry, pickupLocation, image } = validatedData

        const donor = req?.user?.id || "67dbc162c75856aee64a2224"

        if(!image){
            res.status(400).json({
                success:false,
                message:"Image is required"
            })
        }

        const newDonation =  await Donation.create({
            title,
            donor,
            type,
            quantity,
            expiry: type !== "non-perishable" ? expiry : null,
            pickupLocation: {
                type:"Point",
                coordinates: pickupLocation.coordinates,
                address: pickupLocation.address
            },
            image: image
        })

        notifyNearbyVolunteers(io,newDonation)



        res.status(201).json({
            success:true,
            message: "Donation created successfully",
            donation: newDonation
        });
        
    } catch (error) {
        console.log(error,"error while creating donation")
        next(error)
        
    }
}
export const getDonations =async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        
        const donor = req?.user?.id 
        console.log("finded the donor ::", donor)
        const {status,type} = req.query;

        
        let filter: any = {};

        if(donor) filter.donor = donor
        if(status) filter.status = status
        if(type) filter.type = type

        console.log(filter,":: filters")


       
        const donations = await Donation.find(filter)
        .populate("donor","name email")
        // .populate("volunteer","name email")
        // .populate("kiosk","name email")
        .sort({ createdAt: -1 })

        console.log(donations,":: donations queryied")

        if(!donations){
            res.status(404).json({
                success:false,
                message:"No donation matched your filter"
            })
            return;
        }

        res.status(200).json({
            success:true,
            donations
        })
        
      
    } catch (error) {
        console.log(error,"error fetching donor donations ")
        next(error)
        
    }
}
export const getSingleDonation = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const { id } = req.params


        const donation = await Donation.findById(id)
        .populate("donor","name email")
        // .populate("volunteer","name email")
        // .populate("kiosk","name location");

        console.log(donation)

        if(!donation){
            res.status(404).json({
                success:false,
                message: "Donation not found"
            })
            return;
        }

        res.status(200).json({
            success:true,
            donation,
            
        })
        
    } catch (error) {
        console.error("Error fetching donation:", error)
        next(error)
        
    }
}
export const updateDonation = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const { id } = req.params


        console.log(req.body)

        const validatedUpdates = updateDonationSchema.parse(req.body);
        console.log(validatedUpdates,":: DATA")

        const donation = await Donation.findOne({ _id:id,donor:req.user?.id  })

        if(!donation){
            res.status(404).json({
                success:false,
                message: "Donation not found"
            })
            return;
        }

        if(donation.status !== "pending"){
            res.status(400).json({
                success:false,
                message: "Cannot update a claimed or cancelled donation"
            })
            return;
        }

        //Manual Update & Save
        Object.assign(donation, validatedUpdates)
        
        await donation.save();

        res.status(200).json({
            success:true,
            message: "Donation updated successfully",
            donation,
        })

                /*========= Other way of updation ====
        
          const updatedDonation = await Donation.findOneAndUpdate(
          { _id: id, donor: req.user?.id, status: "pending" },
           updates,
           { new: true }
          );

          res.status(200).json({
          success:true,
          message:"donation updated successfully",
          donation
          })
       
        */

        
    } catch (error) {
        console.log("error Updating donation :",error)
        next(error)
        
    }
}
export const deleteDonation = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const { id } = req.params


        const donation = await Donation.findOne({ _id:id , donor:req.user?.id})

        if(!donation){
            res.status(404).json({
                success:false,
                message: "Donation not found"
            })
            return;
        }

        if(donation.status !== "pending"){
            res.status(400).json({
                success:false,
                message: "Cannot delete a claimed donation"
            })
            return;
        }

    
        donation.status = "canceled";
        await donation.save()
            
        res.status(200).json({
            success:true,
            message: "Donation canceled successfully"
        })
  
        
        
    } catch (error) {
        console.log("error deleting donation",error)
        next(error)
        
    }
}


