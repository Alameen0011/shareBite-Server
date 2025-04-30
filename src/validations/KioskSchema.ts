import { z } from "zod"

//createDonation Api
const locationSchema = z.object({
    type: z.literal("Point"),
    coordinates: z
        .array(z.number())
        .length(2, "Coordinates are required"),
        address: z.string().min(5, "Address is required")
});


export const kioskSchema = z.object({
    name:  z.string().min(1, "Kiosk name is required"),
    location:locationSchema,
   
})

//updateDonation Api
export const editKioskSchema = kioskSchema.partial();