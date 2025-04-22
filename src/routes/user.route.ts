import express from "express";
import { UserAuthController, VideoController } from "../controllers";



const router = express.Router();

router.post("/register",UserAuthController.registerUser)
router.post("/verify-register",UserAuthController.verifyRegistration)
router.post("/login",UserAuthController.LoginUser)
router.post("/verify-login",UserAuthController.verifyLogin)
router.post("/logout",UserAuthController.LogoutUser)
router.post("/google-auth",UserAuthController.googleAuth)
router.get("/refresh",UserAuthController.refreshAccess)


router.get("/rtc-token",VideoController.zegoToken)


export default router;