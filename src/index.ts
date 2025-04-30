import config from "./config/env"
import express from "express";
import cors from "cors"
import morgan from 'morgan'
import { Server } from "socket.io"
import { createServer } from "http";

import cookieParser from "cookie-parser"
import connectDB from "./config/db";
import errorHandler from "./middlewares/errorHandler";
import { registerSocketHandlers } from "./sockets";
import { socketAuth } from "./middlewares/socketAuth";

// Routes
import userRoutes from "./routes/user.route"
import donorRoutes from "./routes/donor.route"
import volunteerRoutes from "./routes/volunteer.route"
import adminRoutes from "./routes/admin.route"
import profileRoutes from "./routes/profile.route"


// Connect to MongoDB
connectDB()

// Express App & HTTP Server
const app = express();
const httpServer = createServer(app)


// Socket.IO Setup
const io = new Server(httpServer ,{
  cors: { origin: config.FRONTEND_URL }
})

console.log("io going to middleware")
//socket Middleware
io.use(socketAuth)

//Making io available in controllers
app.set("io",io) 



// Register Socket Handlers
registerSocketHandlers(io)

// Middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(morgan('dev'))


// API Routes
app.use('/api/v1/user',userRoutes)
app.use('/api/v1/admin',adminRoutes)
app.use('/api/v1/donor',donorRoutes)
app.use('/api/v1/volunteer',volunteerRoutes)
app.use('/api/v1/profile',profileRoutes)


// Global Error Handler
app.use(errorHandler);


// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
