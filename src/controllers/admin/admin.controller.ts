import { AuthRequest } from "../../interfaces/auth";
import { NextFunction, Response,Request } from "express";
import User from "../../models/user.model";
import { loginSchema } from "../../validations/authSchema";
import config from "../../config/env";
import MagicToken from "../../models/magicToken.model";
import crypto from "crypto";
import { transporter } from "../../utils/mail";
import { generateToken } from "../../utils/token";

export const getAllUsersForAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string | undefined;
    const search = (req.query.search as string) || "";

    const filter: any = {
      ...(role && role !== "all" ? { role } : { role: {$ne : "admin"} }),
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const Users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-otp,-deliveryOtp");

    res.status(200).json({
      success: true,
      Users,
      page,
      totalPages,
      totalUsers,
      message: "fetched successfully",
    });
  } catch (error) {
    console.log("Get Users Error :", error);
    next(error);
  }
};

export const toggleBlockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    res.status(200).json({
      success: true,
      message: `Operation done successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Toggle Block User Error:", error);
    next(error);
  }
};

export const LoginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { email } = validatedData;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "You are not allowed to be admin",
      });
      return;
    }
     //ensures only the latest login link is usable.
     await MagicToken.deleteMany({ email: existingUser.email });

    const magicToken = crypto.randomBytes(32).toString("hex");

    // Save token in DB (expire in 15 minutes)
    await MagicToken.create({
      email: existingUser.email,
      token: magicToken,
      role: existingUser.role,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    //send email with magic link
    const magicLink = `${config.FRONTEND_URL}/admin/auth/verify-login?token=${magicToken}`;

    await transporter.sendMail({
      from: config.EMAIL_APP,
      to: email,
      subject: "Your Magic Login Link",
      html:  `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
     <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
       <h2 style="color: #333333;">Welcome to ShareBite! 🍽️</h2>
       <p style="font-size: 16px; color: #555;">
         We're glad you're here. To complete your login, please click the button below:
       </p>
       <div style="text-align: center; margin: 30px 0;">
         <a href="${magicLink}" 
            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
           Log in to your account
         </a>
       </div>
       <p style="font-size: 14px; color: #888;">
         This link will expire in 15 minutes. If you didn’t request this, please ignore this email.
       </p>
       <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
       <p style="font-size: 12px; color: #aaa; text-align: center;">
         &copy; ${new Date().getFullYear()} ShareBite. All rights reserved.
       </p>
     </div>
   </div>
     `,
    });

    res.status(200).json({ success: true, message: "please check you email!" });
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin = async ( _req: Request,res: Response, next: NextFunction) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({ success: true, message: "Logged out successfully!" });
  } catch (error) {
    next(error);
  }
}

export const verifyLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query

    const magicToken = await MagicToken.findOne({ token });

    if (!magicToken) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired magic link",
      });
      return;
    }

    if (magicToken!.expiresAt < new Date()) {
      await MagicToken.deleteOne({ token });
      res.status(400).json({
        success: false,
        message: "Magic token expired",
      });
      return;
    }

    const { email } = magicToken

    if (!email) {
      res.status(400).json({ success: false, message: "Invalid token data" });
      return;
    }

    let user = await User.findOne({ email });

    await MagicToken.deleteOne({ token });

    if (!user || !user.role) {
      res.status(400).json({
        success: false,
        message: "Admin is missing. Please register",
      });
      return;
    }

    const id = user?.id;
    const role = user?.role;

    const accessToken = generateToken(id, role, res);

    res.status(201).json({
      success: true,
      token: accessToken,
      role: role,
      message: "Admin Logined successfully",
    });
  } catch (error) {
    next(error);
  }
};
