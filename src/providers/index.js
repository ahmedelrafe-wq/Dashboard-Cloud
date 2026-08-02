const google = require("./google");
const dropbox = require("./dropbox");
const adapters = { google, dropbox };
const PROVIDER_NAMES = Object.keys(adapters);
function getAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`Unknown provider "${name}". Use one of: ${PROVIDER_NAMES.join(", ")}`);
  }
  return adapter;
}
getAdapter.PROVIDER_NAMES = PROVIDER_NAMES;
module.exports = getAdapter;
