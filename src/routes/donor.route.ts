import express from "express"
import { DonorController } from "../controllers"
import { authorizeRoles, protect } from "../middlewares/authMiddleware"


const router = express.Router()


router.get("/donations",protect,authorizeRoles("donor"),DonorController.getDonations)
router.get("/donations/:id",protect,authorizeRoles("donor"),DonorController.getSingleDonation)
router.post("/donations",protect,authorizeRoles("donor"),DonorController.createDonation)
router.put("/donations/:id",protect,authorizeRoles("donor"),DonorController.updateDonation)
router.delete("/donations/:id",protect,authorizeRoles("donor"),DonorController.deleteDonation)


export default router