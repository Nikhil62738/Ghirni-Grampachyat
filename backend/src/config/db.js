const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and configure it.");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 50,
    });
    // eslint-disable-next-line no-console
    console.log("\u2705 MongoDB connected");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("\u274C MongoDB connection error:", err.message);
    throw err;
  }

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("\u26A0\uFE0F MongoDB disconnected");
  });
}

module.exports = connectDB;
