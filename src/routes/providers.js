const express = require("express");
const router = express.Router();
const { Provider } = require("../db");
const getAdapter = require("../providers");
router.get("/providers", async (req, res) => {
  try {
    const names = getAdapter.PROVIDER_NAMES;
    const rows = await Provider.find();
    const list = names.map((name) => {
      const row = rows.find((r) => r.name === name);
      return {
        name,
        connected: !!(row && row.refreshToken),
      };
    });
    res.json({ providers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/:provider/token", async (req, res) => {
  try {
    const { provider } = req.params;
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).json({ error: `Unknown provider "${provider}"` });
    }
    const { clientId, clientSecret, refreshToken } = req.body;
    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({
        error: "Please send clientId, clientSecret and refreshToken in the body.",
      });
    }
    await Provider.updateOne(
      { name: provider },
      {
        $set: { clientId, clientSecret, refreshToken, accessToken: "", expiresAt: 0 },
      },
      { upsert: true }
    );
    res.json({ message: `Saved credentials for ${provider}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
