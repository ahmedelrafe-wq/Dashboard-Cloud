const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { Provider } = require("../db");
const getAdapter = require("../providers");
function redirectBase() {
  return (process.env.OAUTH_REDIRECT_BASE || "http://localhost:3000").replace(/\/$/, "");
}
function redirectUriFor(provider) {
  return `${redirectBase()}/api/${provider}/auth/callback`;
}
const pendingStates = new Map();
function newState() {
  const s = crypto.randomBytes(16).toString("hex");
  pendingStates.set(s, Date.now() + 10 * 60 * 1000); 
  return s;
}
function consumeState(s) {
  const exp = pendingStates.get(s);
  pendingStates.delete(s);
  return exp && exp > Date.now();
}
function popupResultPage(ok, message) {
  const payload = JSON.stringify({ source: "oauth", ok, message });
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
    <p>${ok ? "✓ Connected. You can close this window." : "✗ " + message}</p>
    <script>
      if (window.opener) { window.opener.postMessage(${payload}, "*"); }
      setTimeout(function(){ window.close(); }, ${ok ? 600 : 3000});
    </script>
  </body></html>`;
}
router.get("/providers", async (req, res) => {
  try {
    const names = getAdapter.PROVIDER_NAMES;
    const rows = await Provider.find();
    const list = names.map((name) => {
      const row = rows.find((r) => r.name === name);
      const adapter = getAdapter(name);
      return {
        name,
        connected: !!(row && row.refreshToken),
        email: (row && row.connectedEmail) || "",
        accountName: (row && row.connectedName) || "",
        configured: !!(adapter.oauth && adapter.oauth.clientId() && adapter.oauth.clientSecret()),
      };
    });
    res.json({ providers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:provider/auth/start", (req, res) => {
  try {
    const { provider } = req.params;
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).send(`Unknown provider "${provider}"`);
    }
    const adapter = getAdapter(provider);
    if (!adapter.oauth.clientId() || !adapter.oauth.clientSecret()) {
      return res
        .status(400)
        .send(`${provider} is not configured. Set its CLIENT_ID and CLIENT_SECRET in .env.`);
    }
    const state = newState();
    const url = adapter.oauth.authUrl(redirectUriFor(provider), state);
    res.redirect(url);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get("/:provider/auth/callback", async (req, res) => {
  const { provider } = req.params;
  res.setHeader("Content-Type", "text/html");
  try {
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).send(popupResultPage(false, `Unknown provider "${provider}"`));
    }
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).send(popupResultPage(false, String(error)));
    }
    if (!code || !consumeState(state)) {
      return res.status(400).send(popupResultPage(false, "Invalid or expired sign-in attempt."));
    }
    const adapter = getAdapter(provider);
    const tokens = await adapter.oauth.exchangeCode(code, redirectUriFor(provider));
    if (!tokens.refresh_token) {
      return res
        .status(400)
        .send(popupResultPage(false, "No refresh token returned. Try logging out and connecting again."));
    }
    let account = { email: "", name: "" };
    if (tokens.access_token) {
      account = await adapter.oauth.getAccount(tokens.access_token);
    }
    const now = Date.now();
    await Provider.updateOne(
      { name: provider },
      {
        $set: {
          clientId: adapter.oauth.clientId(),
          clientSecret: adapter.oauth.clientSecret(),
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token || "",
          expiresAt: tokens.expires_in ? now + tokens.expires_in * 1000 : 0,
          connectedEmail: account.email,
          connectedName: account.name,
        },
      },
      { upsert: true }
    );
    res.send(popupResultPage(true, "Connected"));
  } catch (err) {
    res.status(500).send(popupResultPage(false, err.message));
  }
});
router.post("/:provider/logout", async (req, res) => {
  try {
    const { provider } = req.params;
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).json({ error: `Unknown provider "${provider}"` });
    }
    const adapter = getAdapter(provider);
    const row = await Provider.findOne({ name: provider });
    if (row && row.refreshToken) {
      await adapter.oauth.revoke(row.refreshToken);
    }
    await Provider.updateOne(
      { name: provider },
      {
        $set: {
          refreshToken: "",
          accessToken: "",
          expiresAt: 0,
          connectedEmail: "",
          connectedName: "",
        },
      }
    );
    res.json({ message: `Logged out of ${provider}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
