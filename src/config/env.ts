import dotenv from "dotenv";
dotenv.config();


export default {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGO_URI || "mongodb+srv://sayyidalameen2006:allu1981@cluster11.za1zs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster11",
    JWT_ACCESS_KEY:process.env.JWT_ACCESS_KEY || "JLSJDLAKLAS8KKKLASIALLLALALKD99",
    CORS: process.env.CORS_ORIGIN ||"http://localhost:5173",
    NODE_ENV:process.env.NODE_ENV,
    EMAIL_APP:process.env.EMAIL_APP,
    EMAIL_PASS:process.env.EMAIL_PASS,
    FRONTEND_URL:process.env.FRONTEND_URL,
    JWT_REFRESH_KEY:process.env.JWT_REFRESH_KEY || "JLSJDLAKLAS8KKUIIUEYEUEU&&77",
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    APPID_ZEGOCLOUD:process.env.APPID_ZEGOCLOUD,
    SERVER_SECRET_ZEGOCLOUD:process.env.SERVER_SECRET_ZEGOCLOUD
}
