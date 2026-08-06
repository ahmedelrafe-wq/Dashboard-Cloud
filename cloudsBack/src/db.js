const mongoose = require("mongoose");

// Per-user cloud credentials.
// Each document is ONE user's connection to ONE provider ("google" | "dropbox").
// The app's client id/secret are NOT stored here — they live in .env and identify
// *your app* (not the user). Only the signed-in user's own tokens live here, keyed
// by their RegistrationBack User._id, so User A and User B never share tokens.
const credentialSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // owner (User._id)
    provider:       { type: String, required: true },  // "google" | "dropbox"
    refreshToken:   { type: String, default: "" },      // long-lived token from the OAuth popup
    accessToken:    { type: String, default: "" },      // cached short-lived token
    expiresAt:      { type: Number, default: 0 },        // ms timestamp when accessToken expires
    connectedEmail: { type: String, default: "" },      // connected account's email (for display)
    connectedName:  { type: String, default: "" },      // connected account's name (for display)
  },
  { timestamps: true }
);

// One connection per (user, provider) pair.
credentialSchema.index({ userId: 1, provider: 1 }, { unique: true });

const Credential = mongoose.model("Credential", credentialSchema);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

module.exports = { mongoose, connectDB, Credential };
