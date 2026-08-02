require("dotenv").config();
const { connectDB, Provider, mongoose } = require("./db");
const providers = [
  {
    name: "google",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  {
    name: "dropbox",
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  },
];
async function main() {
  await connectDB();
  for (const p of providers) {
    if (p.clientId && p.clientSecret) {
      await Provider.updateOne(
        { name: p.name },
        { $set: { clientId: p.clientId, clientSecret: p.clientSecret } },
        { upsert: true }
      );
      console.log(`Saved app credentials for: ${p.name}`);
    } else {
      console.log(`Skipped ${p.name} (no CLIENT_ID / CLIENT_SECRET in .env)`);
    }
  }
  console.log("\nProviders in the database:");
  const rows = await Provider.find();
  for (const row of rows) {
    const who = row.connectedEmail ? ` as ${row.connectedEmail}` : "";
    console.log(` - ${row.name} (connected: ${row.refreshToken ? "yes" : "no"}${who})`);
  }
  console.log("\nDone. Start the server with:  node src/server.js");
  console.log("Then open the frontend and click Connect to sign in.");
  await mongoose.disconnect();
}
main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
