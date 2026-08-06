const express = require("express");
const crypto = require("crypto");
const auth = require("../auth");
const router = express.Router();
const { Credential } = require("../db");
const getAdapter = require("../providers");

function redirectBase() {
  return (process.env.OAUTH_REDIRECT_BASE || "http://localhost:3100").replace(/\/$/, "");
}
function redirectUriFor(provider) {
  return `${redirectBase()}/api/${provider}/auth/callback`;
}

// OAuth "state" now carries WHICH USER started the flow, because the provider's
// callback comes back without our Authorization header. We store a random nonce
// (anti-CSRF) mapped to the userId, kept in memory for 10 minutes.
const pendingStates = new Map();
function newState(userId) {
  const nonce = crypto.randomBytes(16).toString("hex");
  pendingStates.set(nonce, { userId, exp: Date.now() + 10 * 60 * 1000 });
  return nonce;
}
function consumeState(nonce) {
  const entry = pendingStates.get(nonce);
  pendingStates.delete(nonce);
  if (!entry || entry.exp < Date.now()) return null;
  return entry.userId;
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

// List providers + whether THIS user has each one connected.
router.get("/providers", auth, async (req, res) => {
  try {
    const names = getAdapter.PROVIDER_NAMES;
    const rows = await Credential.find({ userId: req.userId });
    const list = names.map((name) => {
      const row = rows.find((r) => r.provider === name);
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

// Begin sign-in. Protected: we need to know which user is connecting.
// Returns JSON { url } so the frontend can open it in a popup.
router.get("/:provider/auth/start", auth, (req, res) => {
  try {
    const { provider } = req.params;
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).json({ error: `Unknown provider "${provider}"` });
    }
    const adapter = getAdapter(provider);
    if (!adapter.oauth.clientId() || !adapter.oauth.clientSecret()) {
      return res
        .status(400)
        .json({ error: `${provider} is not configured. Set its CLIENT_ID and CLIENT_SECRET in .env.` });
    }
    const state = newState(req.userId);
    const url = adapter.oauth.authUrl(redirectUriFor(provider), state);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Provider redirects back here (no auth header — identity comes from state).
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
    const userId = consumeState(state);
    if (!code || !userId) {
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
    // Upsert THIS user's row for THIS provider.
    await Credential.updateOne(
      { userId, provider },
      {
        $set: {
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

// Disconnect THIS user's provider (revoke + delete the row).
router.post("/:provider/logout", auth, async (req, res) => {
  try {
    const { provider } = req.params;
    if (!getAdapter.PROVIDER_NAMES.includes(provider)) {
      return res.status(400).json({ error: `Unknown provider "${provider}"` });
    }
    const adapter = getAdapter(provider);
    const row = await Credential.findOne({ userId: req.userId, provider });
    if (row && row.refreshToken) {
      await adapter.oauth.revoke(row.refreshToken);
    }
    await Credential.deleteOne({ userId: req.userId, provider });
    res.json({ message: `Logged out of ${provider}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
