import mongoose from "mongoose";
import config from "../config/env"


const connectDB = async () => {
    try {
        const connection = await mongoose.connect(config.mongoURI);
        console.log("mongo db connected via mongoose successfully")
    } catch (error) {
        console.log("Mongoose connection error:",error)
        process.exit(1);
    }
}

export default connectDB