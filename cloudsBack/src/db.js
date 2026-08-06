const mongoose = require("mongoose");


const credentialSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // owner (User._id)
    provider:       { type: String, required: true }, 
    refreshToken:   { type: String, default: "" },      
    accessToken:    { type: String, default: "" },      
    expiresAt:      { type: Number, default: 0 },        
    connectedEmail: { type: String, default: "" },     
    connectedName:  { type: String, default: "" },      
  },
  { timestamps: true }
);

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
