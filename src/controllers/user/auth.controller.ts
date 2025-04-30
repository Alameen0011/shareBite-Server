import { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import { loginSchema, signupSchema } from "../../validations/authSchema";
import User from "../../models/user.model";
import crypto from "crypto";
import MagicToken from "../../models/magicToken.model";
import { transporter } from "../../utils/mail";
import { generateToken } from "../../utils/token";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../../interfaces/auth";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// 🔹 REGISTER (Signup-send-magic-link)
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
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

    //deleting any previously issued magic tokens for the same email before creating a new one ensures only the latest login link is usable..
    await MagicToken.deleteMany({ email });

    const magicToken = crypto.randomBytes(32).toString("hex");

    // Save token in DB (expire in 15 minutes)
    await MagicToken.create({
      email: email,
      token: magicToken,
      role: role,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), 
    });

    //send email with magic link
    const magicLink = `${config.FRONTEND_URL}/auth/verify?token=${magicToken}`;
    await transporter.sendMail({
      from: config.EMAIL_APP,
      to: email,
      subject: "Your Magic Login Link",
      html: `
       <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <h2 style="color: #333333;">Welcome to ShareBite! 🍽️</h2>
        <p style="font-size: 16px; color: #555;">
          We're glad you're here. To complete your registration, please click the button below:
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

    res.status(200).json({ success: true, message: "Magic link sent to your email!" });
    
  } catch (error) {
    next(error);
  }
};

// 🔹 VERIFY REGISTER (verify-magic-link)
export const verifyRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ success: false, message: "Token is missing" });
      return;
    }

    const magicToken = await MagicToken.findOne({ token });

    if (!magicToken) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired magic link",
      });
      return;
    }

    if (magicToken.expiresAt < new Date()) {
      await MagicToken.deleteOne({ token });
      res.status(400).json({
        success: false,
        message: "Magic token expired",
      });
      return;
    }

    const { email, role: roles } = magicToken;

    if (!email || !roles) {
      res.status(400).json({ success: false, message: "Invalid token data" });
      return;
    }


    // User must not already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    } 

    const user = await User.create({
      name: roles === "donor" ? "Donor" : "Volunteer",
      email,
      role:roles,
      verified: true,
    });

  await MagicToken.deleteOne({ token });

    if (!user || !user.role) {
      res.status(400).json({
        success: false,
        message: "User role is missing",
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
      message: "User created successfully" ,
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 LOGIN
export const LoginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { email } = validatedData;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      res.status(400).json({
        success: false,
        message: "User not found, please signup",
      });
      return;
    }

    
    if (existingUser.isBlocked) {
      res.status(403).json({
        error: "blocked",
        message: "Your account has been blocked by the administrator.",
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
    const magicLink = `${config.FRONTEND_URL}/auth/verify-login?token=${magicToken}`;

    await transporter.sendMail({
      from: config.EMAIL_APP,
      to: email,
      subject: "Your Magic Login Link",
      html: `
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

// 🔹 VERIFY LOGIN (verify-magic-link)
export const verifyLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    const magicToken = await MagicToken.findOne({ token });

    if (!magicToken) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired magic link",
      });
      return;
    }

    if (magicToken.expiresAt < new Date()) {
      await MagicToken.deleteOne({ token });
      res.status(401).json({
        success: false,
        message: "Magic token expired",
      });
      return;
    }

    const  { email } = magicToken;

    if (!email) {
      res.status(400).json({ success: false, message: "Invalid token data" });
      return;
    }

    let user = await User.findOne({ email });

    await MagicToken.deleteOne({ token });

    if (!user || !user.role) {
      res.status(400).json({
        success: false,
        message: "User is missing. Please register",
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
      message: "User logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 GOOGLE AUTH LOGIN
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {

  const { credential, client_id } = req.body;
  try {
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: client_id,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;

    let user = await User.findOne({ email });

    // If user does not exist, create a new one
    if (!user) {
      user = await User.create({
        email,
        role: "donor",
        verified: true,
      });
    }

    if (user.isBlocked) {
      res.status(403).json({
        error: "blocked",
        message: "Your account has been blocked by the administrator.",
      });
      return;
    }

    const id = user.id;
    const role = user.role;

    const accessToken = generateToken(id, role, res);


    res.status(201).json({
      success: true,
      token: accessToken,
      role: role,
      message: user
        ? "User logged in successfully"
        : "User created successfully",
    });
  } catch (error) {
    console.log(error, "error in api");
    next(error);
  }
};

// 🔹 NEW ACCESSTOKEN USING REFRESH
export const refreshAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.jwt;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: "No refresh token provided" });
      return;
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_KEY) as DecodedToken;

    if (!decoded) {
      res.status(403).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newAccessToken = jwt.sign({ id: decoded!.id, role: decoded!.role },config.JWT_ACCESS_KEY,{ expiresIn: "1d" });

    res.status(200).json({ token: newAccessToken, success: true, role: decoded.role });
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    next(error);
  }
};

// 🔹 LOGOUT
export const LogoutUser = (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.json({ success: true, message: "Logged out successfully!" });
  } catch (error) {
    next(error);
  }
};
