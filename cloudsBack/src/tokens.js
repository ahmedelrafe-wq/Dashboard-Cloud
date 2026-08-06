const { Provider } = require("./db");
const getAdapter = require("./providers");
async function getValidAccessToken(providerName) {
  const row = await Provider.findOne({ name: providerName });
  if (!row || !row.refreshToken) {
    throw new Error(`Provider "${providerName}" is not connected. Run the seed step first.`);
  }
  const now = Date.now();
  if (row.accessToken && row.expiresAt > now + 60 * 1000) {
    return row.accessToken;
  }
  const adapter = getAdapter(providerName);
  const result = await adapter.refresh(row); 
  const expiresAt = now + result.expires_in * 1000;
  row.accessToken = result.access_token;
  row.expiresAt = expiresAt;
  await row.save();
  return result.access_token;
}
module.exports = { getValidAccessToken };
