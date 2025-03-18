import config from "./config/env"
import express from "express";
import cors from "cors"
import morgan from 'morgan'
import cookieParser from "cookie-parser"
import connectDB from "./config/db";
import errorHandler from "./middlewares/errorHandler";
import userRoutes from "./routes/user.route"
import donorRoutes from "./routes/donor.route"
import volunteerRoutes from "./routes/volunteer.route"
import adminRoutes from "./routes/admin.route"



connectDB()

const app = express();

// Middleware
app.use(cors({
  origin: config.CORS,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(morgan('dev'))




app.use('/api/v1/user',userRoutes)
app.use('/api/v1/admin',adminRoutes)
app.use('/api/v1/donor',donorRoutes)
app.use('/api/v1/volunteer',volunteerRoutes)

app.use(errorHandler);



const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
