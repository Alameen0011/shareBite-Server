import Kiosk from "../../models/kiosk.model";
import { AuthRequest } from "../../interfaces/auth"
import { NextFunction, Response } from "express"
import { editKioskSchema, kioskSchema } from "../../validations/KioskSchema";

export const addKiosk = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
      console.log("inside add kiosk")

        const validatedData = kioskSchema.parse(req.body)
        console.log(validatedData,"data after body zod validation")
        const { name, location } = validatedData

        const newKiosk = new Kiosk({
            name,
            location: {
                type:"Point",
                coordinates: location.coordinates,
                address: location.address
            },
        });

        console.log(newKiosk,"nwe kiosk save to db")


        await newKiosk.save();

        res.status(201).json({
            success:true,
            message:"Kiosk added successfully",
            kiosk:newKiosk
        })


        
    } catch (error) {
        console.log(error)
        next(error)

    }
}


export const getSingleKiosk = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        
                const kiosk = await Kiosk.findById(id)
        
                console.log(kiosk,"Kiosk")
        
                if(!kiosk){
                    res.status(404).json({
                        success:false,
                        message: "kiosk not found"
                    })
                    return;
                }
        
                res.status(200).json({
                    success:true,
                    kiosk,
                   
                })
        
    } catch (error) {
        console.log(error)
        next(error)
    }


}

export const getAllKiosks = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string)  || 1
        const limit = parseInt(req.query.limit as string) || 10


        const skip = (page - 1) * limit
        const totalKiosks = await Kiosk.countDocuments()
        const totalPages = Math.ceil(totalKiosks/limit)

        console.log(page,"Page")
        console.log(limit,"limit")
        console.log(skip,"skip")
        console.log(totalPages,"totalPages")



        
        const kiosks = await Kiosk.find()
                                    .skip(skip)
                                    .sort({createdAt: -1})
                                    .limit(limit)

        res.status(200).json({
          success: true,
          kiosks,
          page,
          totalPages,
          totalKiosks,
          message:"kiosk fetched successfully"
        });

        
    } catch (error) {
        console.log(error)
        next(error)

    }
}

export const editKiosk = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const kioskId = req.params.id;
  
      const { name, location } = editKioskSchema.parse(req.body);
  
      const updateData: any = {};
  
      if (name !== undefined) {
        updateData.name = name;
      }
  
      if (location?.coordinates) {
        updateData.location = {
          type: 'Point',
          coordinates: location.coordinates,
        };
  
        if (location.address) {
          updateData.location.address = location.address;
        }
      }
  
      const updatedKiosk = await Kiosk.findByIdAndUpdate(kioskId, updateData, {
        new: true,
      });
  
      if (!updatedKiosk) {
         res.status(404).json({ success: false, message: 'Kiosk not found' });
         return
      }
  
      res.status(200).json({
        success: true,
        message: 'Kiosk updated successfully',
        kiosk: updatedKiosk,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  };

export const deleteKiosk = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const kioskId = req.params.id;

        // Find and delete the kiosk
        const deletedKiosk = await Kiosk.findByIdAndDelete(kioskId);
    
        if (!deletedKiosk) {
          res.status(404).json({ success: false, message: 'Kiosk not found' })
          return;
        }
    
        res.status(200).json({
          success: true,
          message: 'Kiosk deleted successfully',
        });



        
    } catch (error) {
        console.log(error)
        next(error)

    }
}






