const express = require("express");
const router = express.Router();
const getAdapter = require("../providers");
const { getValidAccessToken } = require("../tokens");
const { filterByType, categoryOf } = require("../fileType");
const upload = require("../upload");
async function prepare(providerName) {
  if (!getAdapter.PROVIDER_NAMES.includes(providerName)) {
    const err = new Error(`Unknown provider "${providerName}"`);
    err.status = 400;
    throw err;
  }
  const adapter = getAdapter(providerName);
  const token = await getValidAccessToken(providerName);
  return { adapter, token };
}
router.get("/:provider/files", async (req, res) => {
  try {
    const { adapter, token } = await prepare(req.params.provider);
    let files = await adapter.listFiles(token);
    files = filterByType(files, req.query.type);
    const ascending = req.query.order === "asc";
    files.sort((a, b) =>
      ascending ? a.uploadedAt - b.uploadedAt : b.uploadedAt - a.uploadedAt
    );
    const result = files.map((f) => ({
      ...f,
      category: categoryOf(f.mimeType, f.name),
      uploadedAtReadable: new Date(f.uploadedAt).toISOString(),
    }));
    res.json({ provider: req.params.provider, count: result.length, files: result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
router.get("/:provider/files/:id/view", async (req, res) => {
  try {
    const { adapter, token } = await prepare(req.params.provider);
    const file = await adapter.viewFile(token, req.params.id);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.name.replace(/"/g, "")}"`
    );
    res.send(file.buffer);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
router.post("/:provider/files", upload.single("file"), async (req, res) => {
  try {
    const { adapter, token } = await prepare(req.params.provider);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use form field 'file'." });
    }
    const saved = await adapter.uploadFile(
      token,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.status(201).json({ message: "Uploaded.", file: saved });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
router.patch("/:provider/files/:id", async (req, res) => {
  try {
    const { adapter, token } = await prepare(req.params.provider);
    const newName = req.body.name;
    if (!newName) {
      return res.status(400).json({ error: "Please send a new 'name' in the body." });
    }
    const updated = await adapter.editFile(token, req.params.id, newName);
    res.json({ message: "Renamed.", file: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
router.delete("/:provider/files/:id", async (req, res) => {
  try {
    const { adapter, token } = await prepare(req.params.provider);
    await adapter.deleteFile(token, req.params.id);
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});
module.exports = router;
