import express from "express"
import { AdminAnalyticsController, AdminController, KioskController, MessageController } from "../controllers"
import { authorizeRoles, protect } from "../middlewares/authMiddleware"


const router = express.Router()

// Admin Auth 
router.post("/login",AdminController.LoginUser)
router.post("/verify-login",AdminController.verifyLogin)

// User Management
router.get("/users",protect,authorizeRoles("admin"),AdminController.getAllUsersForAdmin)
router.patch("/user/:id/block",protect,authorizeRoles("admin"),AdminController.toggleBlockUser)


// Kiosk Management
router.get('/kiosks',protect,authorizeRoles("admin"),KioskController.getAllKiosks)
router.get('/kiosk/:id',protect,authorizeRoles("admin"),KioskController.getSingleKiosk)
router.post('/kiosks',protect,authorizeRoles("admin"),KioskController.addKiosk);
router.patch('/kiosks/:id',protect,authorizeRoles("admin"),KioskController.editKiosk);
router.delete('/kiosks/:id',protect,authorizeRoles("admin"),KioskController.deleteKiosk);


//Support - Messages
router.get("/message/:id",protect,authorizeRoles("admin","volunteer","donor"), MessageController.getMessages)
router.get("/message",protect,authorizeRoles("admin","volunteer","donor"),MessageController.getUsersWhoMessagedAdmin)
router.post("/message/send/:id",protect,authorizeRoles("admin","volunteer","donor"),MessageController.sendMessage)


//Admin-dashboard api's
router.get('/totalDonations',protect,authorizeRoles("admin"), AdminAnalyticsController.getTotalDonations);
router.get('/totalVolunteers',protect,authorizeRoles("admin"), AdminAnalyticsController.getTotalVolunteers);
router.get('/totalDonors', protect,authorizeRoles("admin"),AdminAnalyticsController.getTotalDonors);
router.get('/totalKiosks',protect,authorizeRoles("admin"), AdminAnalyticsController.getTotalKiosks);
router.get('/donationTrend',protect,authorizeRoles("admin"),AdminAnalyticsController.getDonationTrend);



export default router