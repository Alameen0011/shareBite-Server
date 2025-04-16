import express from "express"
import { authorizeRoles, protect } from "../middlewares/authMiddleware"
import { AdminController } from "../controllers"


const router = express.Router()

router.get("/users",protect,authorizeRoles("admin"),AdminController.getAllUsersForAdmin)
router.patch("/user/:id/block",protect,authorizeRoles("admin"),AdminController.getAllUsersForAdmin)



export default router