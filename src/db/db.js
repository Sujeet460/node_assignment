import mongoose from "mongoose";
import dbConfig from "../config/db.js";

const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    process.exit(1);
  }
};

export default connectDB;