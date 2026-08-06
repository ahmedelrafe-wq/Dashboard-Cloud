const mongoose = require("mongoose");
const providerSchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true }, 
  clientId:      { type: String, default: "" },                  
  clientSecret:  { type: String, default: "" },                  
  refreshToken:  { type: String, default: "" },                  
  accessToken:   { type: String, default: "" },                  
  expiresAt:     { type: Number, default: 0 },                   
  connectedEmail:{ type: String, default: "" },                  
  connectedName: { type: String, default: "" },                  
});
const Provider = mongoose.model("Provider", providerSchema);
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill it in.");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
module.exports = { mongoose, connectDB, Provider };
