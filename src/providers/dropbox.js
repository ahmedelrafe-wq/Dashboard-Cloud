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
  refresh,
  listFiles,
  viewFile,
  uploadFile,
  editFile,
  deleteFile,
};
