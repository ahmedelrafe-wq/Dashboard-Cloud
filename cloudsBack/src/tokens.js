const { Credential } = require("./db");
const getAdapter = require("./providers");


async function getValidAccessToken(userId, providerName) {
  const row = await Credential.findOne({ userId, provider: providerName });
  if (!row || !row.refreshToken) {
    const err = new Error(`"${providerName}" is not connected for this account. Connect it first.`);
    err.status = 400;
    throw err;
  }

  const now = Date.now();
  if (row.accessToken && row.expiresAt > now + 60 * 1000) {
    return row.accessToken;
  }

  const adapter = getAdapter(providerName);
  const result = await adapter.refresh({
    refreshToken: row.refreshToken,
    clientId: adapter.oauth.clientId(),
    clientSecret: adapter.oauth.clientSecret(),
  });

  row.accessToken = result.access_token;
  row.expiresAt = now + result.expires_in * 1000;
  await row.save();
  return result.access_token;
}

module.exports = { getValidAccessToken };
