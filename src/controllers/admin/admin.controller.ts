import { AuthRequest } from "../../interfaces/auth";
import { NextFunction, Response,Request } from "express";
import User from "../../models/user.model";
import { loginSchema } from "../../validations/authSchema";
import config from "../../config/env";
import MagicToken from "../../models/magicToken.model";
import crypto from "crypto";
import { transporter } from "../../utils/mail";
import { generateToken } from "../../utils/token";

export const getAllUsersForAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string | undefined;
    const search = (req.query.search as string) || "";

    const filter: any = {
      ...(role && role !== "all" ? { role } : {}),
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
      message: "users fetched successfully",
    });
  } catch (error) {
    console.log("Get Users Error :", error);
    next(error);
  }
};

export const toggleBlockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
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

export const LoginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
    });

    res.json({ success: true, message: "please check you email!" });
  } catch (error) {
    next(error);
  }
};

export const verifyLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query

    const magicToken = await MagicToken.findOne({ token });

    if (!magicToken) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired magic link",
      });
      return;
    }

    if (magicToken!.expiresAt < new Date()) {
      await MagicToken.deleteOne({ token });
      res.status(401).json({
        success: false,
        message: "Magic token expired",
      });
      return;
    }

    const email = magicToken?.email;

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
