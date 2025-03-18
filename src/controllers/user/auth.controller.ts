import { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import { loginSchema, signupSchema } from "../../validations/authSchema";
import User from "../../models/user.model";
import crypto from "crypto";
import MagicToken from "../../models/magicToken.model";
import { transporter } from "../../utils/mail";
import { generateToken } from "../../utils/token";

// 🔹 REGISTER (Signup-send-magic-link)
export const registerUser = async (  req: Request, res: Response,  next: NextFunction ) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const { email, role } = validatedData;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        message: "Email already registered",
      });
      return;
    }

    const user = await User.create({
      email,
      role,
    });

    const magicToken = crypto.randomBytes(32).toString("hex");

    // Save token in DB (expire in 15 minutes)
    await MagicToken.create({
      userId: user._id,
      token: magicToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    console.log(config.EMAIL_APP,email)

    //send email with magic link
    const magicLink = `${config.FRONTEND_URL}/auth/magic-login?token=${magicToken}`;
    await transporter.sendMail({
      from: config.EMAIL_APP,
      to: email,
      subject: "Your Magic Login Link",
      html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
    });

    res.json({ success: true, message: "Magic link sent to your email!" });
  } catch (error) {
    next(error);
  }
};

// 🔹 VERIFY REGISTER (verify-magic-link)
export const verifyRegistration = async ( req: Request, res: Response, next: NextFunction ) => {
  try {
    const { token } = req.query;

    const magicToken = await MagicToken.findOne({ token });

    if (!magicToken) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired magic link",
      });
    }

    if (magicToken!.expiresAt < new Date()) {
      await MagicToken.deleteOne({ token });
      res.status(401).json({
        success: false,
        message: "Magic token expired",
      });
    }

    const user = await User.findById(magicToken?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await MagicToken.deleteOne({ token });

    if (!user || !user.role) {
      return res.status(400).json({
        success: false,
        message: "User role is missing",
      });
    }

    const id = user?.id;
    const role = user?.role;

    const accessToken = generateToken(id, role, res);

    console.log(accessToken, "accessToken");

    res.status(201).json({
      success: true,
      token: accessToken,
      role: role,
      message: "user created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 LOGIN
export const LoginUser = async ( req: Request,res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { email } = validatedData;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
        res.status(404).json({
            success:false,
            message:"User not found please signup"
        })
        return;

    } 
    const magicToken = crypto.randomBytes(32).toString("hex");

      // Save token in DB (expire in 15 minutes)
      await MagicToken.create({
        userId: existingUser!._id,
        token: magicToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
      });

      //send email with magic link
      const magicLink = `${config.FRONTEND_URL}/auth/magic-login?token=${magicToken}`;

      await transporter.sendMail({
        from: config.EMAIL_APP,
        to: email,
        subject: "Your Magic Login Link",
        html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
      });

      res.json({ success: true, message: "Magic link sent to your email!" });
  } catch (error) {
    next(error);
  }
};

// 🔹 VERIFY REGISTER (verify-magic-link)
export const verifyLogin = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
      const { token } = req.query;
  
      const magicToken = await MagicToken.findOne({ token });
  
      if (!magicToken) {
        res.status(401).json({
          success: false,
          message: "Invalid or expired magic link",
        });
      }
  
      if (magicToken!.expiresAt < new Date()) {
        await MagicToken.deleteOne({ token });
        res.status(401).json({
          success: false,
          message: "Magic token expired",
        });
      }
  
      const user = await User.findById(magicToken?.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      await MagicToken.deleteOne({ token });
  
      if (!user || !user.role) {
        return res.status(400).json({
          success: false,
          message: "User role is missing",
        });
      }
  
      const id = user?.id;
      const role = user?.role;
  
      const accessToken = generateToken(id, role, res);
  
      console.log(accessToken, "accessToken");
  
      res.status(201).json({
        success: true,
        token: accessToken,
        role: role,
        message: "user Logined successfully",
      });
    } catch (error) {
      next(error);
    }
  };







// 🔹 GOOGLE AUTH LOGIN
export const googleAuth = (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log(error);
  }
};


// 🔹 LOGOUT
export const LogoutUser = (req: Request, res: Response , next: NextFunction) => {
  try {
    res.cookie("jwt", "", { 
        httpOnly: true, 
        expires: new Date(0) 
      });
  
      res.json({ success: true, message: "Logged out successfully!" });
  } catch (error) {
    next(error);
  }
};
