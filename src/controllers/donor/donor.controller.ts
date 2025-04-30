import { NextFunction, Response, Request } from "express"
import Donation from "../../models/donation.model"
import { donationSchema, updateDonationSchema } from "../../validations/donationSchema";
import { notifyNearbyVolunteers } from "../../sockets/volunteer.socket";
import User from "../../models/user.model";
import Kiosk from "../../models/kiosk.model";



export const createDonation = async (req: Request,res: Response, next: NextFunction) => {
    try {
        const io = req.app.get("io")

        


        const validatedData = donationSchema.parse(req.body)


        const { title, type, quantity, expiry, pickupLocation, image } = validatedData

        const donor = req?.user?.id 

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

export const getDonations =async (req: Request,res: Response, next: NextFunction) => {
    try {
        
        console.log(req.user,"RELEFJLJEWOJIO Got the fukcing id")

        const donor = req?.user?.id 
        const {status,type} = req.query;

        const donorProfile = await User.findById(donor);
        if (!donorProfile || !donorProfile.name || !donorProfile.email || !donorProfile.phone) {
            res.status(400).json({
                success: false,
                message: "Please complete your profile before making donations"
            });
            return;
        }


        
        let filter: any = {};

        if(donor) filter.donor = donor
        if(status) filter.status = status
        if(type) filter.type = type


       
           // Start the donation query with basic population for donor
           const donations =await Donation.find(filter)
           .populate("donor", "name email phone")
           .sort({ createdAt: -1 })


       if (!donations) {
         res.status(404).json({
            success: false,
            message: "No donation matched your filter"
        });
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

export const getSingleDonation = async (req: Request,res: Response, next: NextFunction) => {
    try {
        const { id } = req.params


        // Fetch the donation by ID without populating initially
        const donation = await Donation.findById(id)
            .populate("donor", "name email phone");


        if (!donation) {
             res.status(404).json({
                success: false,
                message: "Donation not found"
            });
            return;
        }



        // Conditionally populate volunteer if the data is valid
        if (donation.volunteer) {
            const volunteer = await User.findById(donation.volunteer);
            if (volunteer && volunteer.name && volunteer.email && volunteer.phone) {
                await donation.populate("volunteer", "name email phone");
            }
        }

        // Conditionally populate kiosk if the data is valid
        if (donation.kiosk) {
   
            const kiosk = await Kiosk.findById(donation.kiosk);
       
            if (kiosk && kiosk.name && kiosk.location) {
                await donation.populate("kiosk", "name location");
            }
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

export const updateDonation = async (req: Request,res: Response, next: NextFunction) => {
    try {
        const { id } = req.params


        const validatedUpdates = updateDonationSchema.parse(req.body);

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

export const deleteDonation = async (req: Request,res: Response, next: NextFunction) => {
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


