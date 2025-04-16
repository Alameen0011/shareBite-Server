import Kiosk from "../../models/kiosk.model";
import { AuthRequest } from "../../interfaces/auth"
import { NextFunction, Response } from "express"

export const addKiosk = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const {name,coordinates} = req.body; //[longitude/latitude]

        const newKiosk = new Kiosk({
            name,
            location: {
                type:"Point",
                coordinates
            },
        });


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

export const getAllKiosks = async (_req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const kiosks = await Kiosk.find();

        res.status(200).json({
          success: true,
          kiosks,
        });

        
    } catch (error) {
        console.log(error)
        next(error)

    }
}

export const editKiosk = async (req: AuthRequest,res: Response, next: NextFunction) => {
    try {

        const kioskId = req.params.id;
        const { name, coordinates } = req.body;


        const updatedKiosk = await Kiosk.findByIdAndUpdate(
            kioskId,
            { name, location: { type: 'Point', coordinates } },
            { new: true }
          );

          if (!updatedKiosk) {
             res.status(404).json({ success: false, message: 'Kiosk not found' });
             return;
          }

          res.status(200).json({
            success: true,
            message: 'Kiosk updated successfully',
            kiosk: updatedKiosk,
          });




        
    } catch (error) {
        console.log(error)
        next(error)

    }
}

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






