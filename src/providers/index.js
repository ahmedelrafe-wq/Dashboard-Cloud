const google = require("./google");
const dropbox = require("./dropbox");
const onedrive = require("./onedrive");
const adapters = { google, dropbox, onedrive };
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
