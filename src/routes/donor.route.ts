import express from "express"
import { DonorController } from "../controllers"


const router = express.Router()


router.get("/donations",DonorController.getDonations)
router.get("/donations/:id",DonorController.getSingleDonation)
router.post("/donations",DonorController.createDonation)
router.put("/donations/:id",DonorController.updateDonation)
router.delete("/donations/:id",DonorController.deleteDonation)


export default router