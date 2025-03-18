import express from "express";
import { UserAuthController } from "../controllers";



const router = express.Router();

router.post("/register",UserAuthController.registerUser)
router.post("/login",UserAuthController.LoginUser)
router.post("/google-auth",UserAuthController.googleAuth)
router.post("/logout",UserAuthController.LogoutUser)


export default router;