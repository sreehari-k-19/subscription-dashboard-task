import mongoose from "mongoose";
import { env } from "./env";

const RECONNECT_DELAY = 5000;

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected — retrying in 5s...");
  setTimeout(connectDB, RECONNECT_DELAY);
});

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: "subscription_dashboard",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    setTimeout(connectDB, RECONNECT_DELAY);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
}
