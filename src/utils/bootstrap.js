import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const bootstrapAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is not set in environment variables");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected for bootstrapping...");

    const adminEmail = "admin@taskmanager.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      await User.updateOne({ email: adminEmail }, { $set: { isVerified: true } });
      console.log("Admin user already exists, updated verification status:", adminEmail);
    } else {
      const adminUser = new User({
        username: "admin",
        email: adminEmail,
        password: "AdminPassword@123", // Will be hashed by pre-save hook
        role: "admin",
        isVerified: true,
      });
      await adminUser.save();
      console.log("Default Admin user created successfully!");
      console.log("Email: admin@taskmanager.com");
      console.log("Password: AdminPassword@123");
    }
    process.exit(0);
  } catch (error) {
    console.error("Bootstrapping failed:", error);
    process.exit(1);
  }
};

bootstrapAdmin();
