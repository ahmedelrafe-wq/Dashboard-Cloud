const oauth = {
  clientId: () => process.env.DROPBOX_CLIENT_ID || "",
  clientSecret: () => process.env.DROPBOX_CLIENT_SECRET || "",
  authUrl(redirectUri, state) {
    const url = new URL("https://www.dropbox.com/oauth2/authorize");
    url.searchParams.set("client_id", oauth.clientId());
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("token_access_type", "offline");
    url.searchParams.set("force_reapprove", "true");
    url.searchParams.set("state", state);
    return url.toString();
  },
  async exchangeCode(code, redirectUri) {
    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: oauth.clientId(),
      client_secret: oauth.clientSecret(),
      redirect_uri: redirectUri,
    });
    const res = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) {
      throw new Error(`Dropbox token exchange failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return {
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  },
  async getAccount(accessToken) {
    const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return { email: "", name: "" };
    const data = await res.json();
    return {
      email: data.email || "",
      name: (data.name && data.name.display_name) || "",
    };
  },
  async revoke(token) {
    if (!token) return;
    await fetch("https://api.dropboxapi.com/2/auth/token/revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
};
async function refresh(row) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refreshToken,
    client_id: row.clientId,
    client_secret: row.clientSecret,
  });
  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox refresh failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in, 
  };
}
async function listFiles(token) {
  const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: "", recursive: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox list failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const entries = data.entries || [];
  return entries
    .filter((e) => e[".tag"] === "file")
    .map((f) => ({
      id: f.id, 
      name: f.name,
      mimeType: "",
      size: f.size || 0,
      uploadedAt: new Date(f.server_modified).getTime(),
    }));
}
async function viewFile(token, fileId) {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: fileId }),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox download failed (${res.status}): ${text}`);
  }
  const apiResult = JSON.parse(res.headers.get("dropbox-api-result") || "{}");
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    buffer,
    mimeType: "application/octet-stream", 
    name: apiResult.name || "download",
  };
}
async function uploadFile(token, buffer, fileName, mimeType) {
  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: "/" + fileName, 
        mode: "add",
        autorename: true, 
      }),
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox upload failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: "",
    size: data.size || 0,
    uploadedAt: new Date(data.server_modified).getTime(),
  };
}
async function editFile(token, fileId, newName) {
  const res = await fetch("https://api.dropboxapi.com/2/files/move_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_path: fileId,
      to_path: "/" + newName, 
      autorename: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox rename failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const f = data.metadata;
  return {
    id: f.id,
    name: f.name,
    mimeType: "",
    size: f.size || 0,
    uploadedAt: new Date(f.server_modified).getTime(),
  };
}
async function deleteFile(token, fileId) {
  const res = await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: fileId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox delete failed (${res.status}): ${text}`);
  }
  return { success: true };
}
module.exports = {
  oauth,
  refresh,
  listFiles,
  viewFile,
  uploadFile,
  editFile,
  deleteFile,
};
