import { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import { loginSchema, signupSchema } from "../../validations/authSchema";
import User from "../../models/user.model";
import crypto from "crypto";
import MagicToken from "../../models/magicToken.model";
import { transporter } from "../../utils/mail";
import { generateToken } from "../../utils/token";
import jwt from "jsonwebtoken"
import { DecodedToken } from "../../interfaces/auth";
import { OAuth2Client } from "google-auth-library";




const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)

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

    const magicToken = crypto.randomBytes(32).toString("hex");

    // Save token in DB (expire in 15 minutes)
    await MagicToken.create({
      email:email,
      token: magicToken,
      role:role,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    //send email with magic link
    const magicLink = `${config.FRONTEND_URL}/auth/verify?token=${magicToken}`;
    await transporter.sendMail({
      from: config.EMAIL_APP,
      to: email,
      subject: "Your Magic Login Link",
      html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
    });

    res.status(200).json({ success: true, message: "Magic link sent to your email!" });
  } catch (error) {
    next(error);
  }
};

// 🔹 VERIFY REGISTER (verify-magic-link)
export const verifyRegistration = async ( req: Request, res: Response, next: NextFunction ) => {
  try {
    const { token } = req.query;

    console.log(token,"token")

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
    const roles = magicToken?.role;
    

    if (!email || !roles) {
       res.status(400).json({ success: false, message: "Invalid token data" })
       return;
     }


    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name:  roles === "donor" ? "Donor" : "Volunteer",
        email: email,
        role: roles, 
        verified: true,
      });
    }

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
        html: `<p>Click <a href="${magicLink}">here</a> to log in.</p>`,
      });

      res.json({ success: true, message: "please check you email!" });
  } catch (error) {
    next(error);
  }
};

// 🔹 VERIFY LOGIN (verify-magic-link)
export const verifyLogin = async ( req: Request, res: Response, next: NextFunction ) => {
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
         res.status(400).json({ success: false, message: "Invalid token data" })
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
        message: "user Logined successfully",
      });
      
    } catch (error) {
      next(error);
    }
  };


// 🔹 GOOGLE AUTH LOGIN
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {

  const { token } = req.body;
  console.log(token,"token send through api")
  try {
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    console.log(ticket,"========================ticket")

    const payload = ticket.getPayload();
    console.log(payload, "================Payload from Google");

    const email = payload?.email

    let user = await User.findOne({ email });

    // If user does not exist, create a new one
    if (!user) {
      user = await User.create({
        email,
        role: "donor",
        verified: true,
      });
    }

    // Extract ID and role
    const id = user.id;
    const role = user.role;

    console.log(id, "== userID Google Auth", role, "== role");

    // Generate access token
    const accessToken = generateToken(id, role, res);

    // Send response with token & role
    res.status(201).json({
      success: true,
      token: accessToken,
      role: role,
      message: user ? "User logged in successfully" : "User created successfully",
    });

  } catch (error) {
    console.log(error,"error in api");
    next(error);
  }
};

// 🔹 NEW ACCESSTOKEN USING REFRESH
export const refreshAccess = (req: Request, res: Response, next:NextFunction) => {
  try {
    console.log("inside refresh access api")
    console.log(req.cookies);
    // Get the refresh token from the HTTP-only cookie
    const refreshToken = req.cookies.jwt;

    console.log("refreshToken", refreshToken);

    if (!refreshToken) {
       res.status(401).json({ success: false, message: "No refresh token provided" })
       return;
    }
    // Verify the refresh token
    const decoded = jwt.verify( refreshToken,config.JWT_REFRESH_KEY)  as DecodedToken

    console.log(decoded);

    if (!decoded) {
       res.status(403).json({ success: false, message: "Invalid refresh token" })
       return;
    }

        // Generate a new access token using the decoded userId and role
        const newAccessToken = jwt.sign(
          { id: decoded!.id, role: decoded!.role }, // No DB call needed, role is in the token
          config.JWT_ACCESS_KEY,
          { expiresIn: "1d" } 
        )
    
   
   


     res.status(200).json({  token: newAccessToken, success:true, role: decoded.role,});
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    next(error)
  }
};

// 🔹 LOGOUT
export const LogoutUser = (_req: Request, res: Response , next: NextFunction) => {
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
