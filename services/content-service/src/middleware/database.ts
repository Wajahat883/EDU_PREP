import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUrl =
      process.env.MONGODB_URI || "mongodb://localhost:27017/eduprep";
    await mongoose.connect(mongoUrl);
    console.log("✅ Content Service connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ MongoDB disconnection failed:", error);
    process.exit(1);
  }
};
