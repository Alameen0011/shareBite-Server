import express from "express";
import { VolunteerController } from "../controllers";
// import { authorizeRoles, protect } from "../middlewares/authMiddleware"

const router = express.Router()


router.get("/donations/available",VolunteerController.getAvailableDonations)
router.patch('/donations/:id/claim', VolunteerController.claimDonation)
router.patch("/donations/:id/pickup",VolunteerController.markAsPickedUp)
router.patch("/donations/:id/delivered", VolunteerController.markAsDelivered)



export default router