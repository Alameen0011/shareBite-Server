import express from "express"
import { authorizeRoles, protect } from "../middlewares/authMiddleware"
import { AdminController, KioskController } from "../controllers"


const router = express.Router()

// User management
router.get("/users",protect,authorizeRoles("admin"),AdminController.getAllUsersForAdmin)
router.patch("/user/:id/block",protect,authorizeRoles("admin"),AdminController.getAllUsersForAdmin)


// Kiosk Management
router.get('/kiosks',protect,authorizeRoles("admin"),KioskController.getAllKiosks)
router.post('/kiosks', protect, authorizeRoles("admin"), KioskController.addKiosk);
router.patch('/kiosks/:id', protect, authorizeRoles("admin"),KioskController.editKiosk);
router.delete('/kiosks/:id', protect, authorizeRoles("admin"), KioskController.deleteKiosk);



export default router