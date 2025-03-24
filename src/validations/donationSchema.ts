import { z } from "zod"

//createDonation Api
const pickupLocationSchema = z.object({
    type: z.literal("Point"),//Ensures only point is allowed
    coordinates: z
        .array(z.number())
        .length(2, "Coordinates must contain exactly [longitude, latitude]"),
        address: z.string().min(5, "Address must be at least 5 characters")
});


export const donationSchema = z.object({
    type: z.enum(["perishable","non-perishable","cooked"]),
    quantity: z.number().min(1, "Quantity must be atleast 1"),
    expiry: z.union([z.string().datetime(), z.null()]).optional(), //Optional expiry
    pickupLocation:pickupLocationSchema,
    image: z.string().url("Invalid image URL")
})

//updateDonation Api
export const updateDonationSchema = donationSchema.partial();