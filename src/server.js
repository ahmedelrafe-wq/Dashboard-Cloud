require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const providersRoutes = require("./routes/providers");
const filesRoutes = require("./routes/files");
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "Cloud File Dashboard API is running.",
    tryThis: [
      "GET  /api/providers",
      "GET  /api/google/files?type=image&order=desc",
      "POST /api/google/files            (multipart form field: file)",
      "GET  /api/google/files/:id/view",
      "PATCH /api/google/files/:id       ({ name })",
      "DELETE /api/google/files/:id",
    ],
  });
});
app.use("/api", providersRoutes);
app.use("/api", filesRoutes);
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not start server:", err.message);
    process.exit(1);
  });
