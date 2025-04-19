import express from "express";
import { VolunteerController } from "../controllers";
import { authorizeRoles, protect } from "../middlewares/authMiddleware"

const router = express.Router()


router.get("/donations/available",protect,authorizeRoles("volunteer"),VolunteerController.getAvailableDonations)
router.get("/donations/:id/nearestKiosk",protect,authorizeRoles("volunteer"),VolunteerController.nearestKiosk)
router.patch('/donations/:id/claim',protect,authorizeRoles("volunteer"), VolunteerController.claimDonation)
router.patch('/donations/:id/verifyPickup',protect,authorizeRoles("volunteer"),VolunteerController.verifyAndPickup)
router.patch("/donations/:id/delivered",protect,authorizeRoles("volunteer"),VolunteerController.verifyAndDeliver)


export default router