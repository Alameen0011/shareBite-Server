import express from "express"
import { AdminController, KioskController, MessageController } from "../controllers"


const router = express.Router()

// User management
router.get("/users",AdminController.getAllUsersForAdmin)
router.patch("/user/:id/block",AdminController.toggleBlockUser)


// Kiosk Management
router.get('/kiosks',KioskController.getAllKiosks)
router.get('/kiosk/:id',KioskController.getSingleKiosk)
router.post('/kiosks',  KioskController.addKiosk);
router.patch('/kiosks/:id',KioskController.editKiosk);
router.delete('/kiosks/:id',KioskController.deleteKiosk);


//Support - messages
router.get("/message/:id",MessageController.getMessages)
router.post("/message/send/:id",MessageController.sendMessage)



export default router