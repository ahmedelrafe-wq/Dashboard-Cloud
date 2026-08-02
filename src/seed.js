require("dotenv").config();
const { connectDB, Provider, mongoose } = require("./db");
const providers = [
  {
    name: "google",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  {
    name: "dropbox",
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
  },
  {
    name: "onedrive",
    clientId: process.env.ONEDRIVE_CLIENT_ID,
    clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
    refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN,
  },
];
async function main() {
  await connectDB();
  for (const p of providers) {
    if (p.refreshToken && p.clientId && p.clientSecret) {
      await Provider.updateOne(
        { name: p.name },
        {
          $set: {
            clientId: p.clientId,
            clientSecret: p.clientSecret,
            refreshToken: p.refreshToken,
          },
        },
        { upsert: true }
      );
      console.log(`Saved credentials for: ${p.name}`);
    } else {
      console.log(`Skipped ${p.name} (no credentials in .env)`);
    }
  }
  console.log("\nProviders in the database:");
  const rows = await Provider.find();
  for (const row of rows) {
    console.log(` - ${row.name} (connected: ${row.refreshToken ? "yes" : "no"})`);
  }
  console.log("\nDone. You can now start the server with:  node src/server.js");
  await mongoose.disconnect();
}
main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
