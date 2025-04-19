import express from "express"
import { authorizeRoles, protect } from "../middlewares/authMiddleware"
import { ProfileController } from "../controllers"


const router = express.Router()


router.post("/updateProfile",protect,authorizeRoles("volunteer","donor","admin"),ProfileController.updateProfile)
router.get("/getProfile",protect,authorizeRoles("volunteer","donor","admin"),protect,ProfileController.getProfile)



export default router