const GRAPH = "https://graph.microsoft.com/v1.0";
async function refresh(row) {
  const body = new URLSearchParams({
    client_id: row.clientId,
    client_secret: row.clientSecret,
    refresh_token: row.refreshToken,
    grant_type: "refresh_token",
    scope: "Files.ReadWrite offline_access",
  });
  const res = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneDrive refresh failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in, 
  };
}
async function listFiles(token) {
  const res = await fetch(`${GRAPH}/me/drive/root/children`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneDrive list failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const items = data.value || [];
  return items
    .filter((item) => item.file)
    .map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: (f.file && f.file.mimeType) || "",
      size: f.size || 0,
      uploadedAt: new Date(f.createdDateTime).getTime(),
    }));
}
async function viewFile(token, fileId) {
  const metaRes = await fetch(`${GRAPH}/me/drive/items/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    const text = await metaRes.text();
    throw new Error(`OneDrive metadata failed (${metaRes.status}): ${text}`);
  }
  const meta = await metaRes.json();
  const contentRes = await fetch(`${GRAPH}/me/drive/items/${fileId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentRes.ok) {
    const text = await contentRes.text();
    throw new Error(`OneDrive download failed (${contentRes.status}): ${text}`);
  }
  const buffer = Buffer.from(await contentRes.arrayBuffer());
  return {
    buffer,
    mimeType: (meta.file && meta.file.mimeType) || "application/octet-stream",
    name: meta.name,
  };
}
async function uploadFile(token, buffer, fileName, mimeType) {
  const url = `${GRAPH}/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneDrive upload failed (${res.status}): ${text}`);
  }
  const f = await res.json();
  return {
    id: f.id,
    name: f.name,
    mimeType: (f.file && f.file.mimeType) || "",
    size: f.size || 0,
    uploadedAt: new Date(f.createdDateTime).getTime(),
  };
}
async function editFile(token, fileId, newName) {
  const res = await fetch(`${GRAPH}/me/drive/items/${fileId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneDrive rename failed (${res.status}): ${text}`);
  }
  const f = await res.json();
  return {
    id: f.id,
    name: f.name,
    mimeType: (f.file && f.file.mimeType) || "",
    size: f.size || 0,
    uploadedAt: new Date(f.createdDateTime).getTime(),
  };
}
async function deleteFile(token, fileId) {
  const res = await fetch(`${GRAPH}/me/drive/items/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneDrive delete failed (${res.status}): ${text}`);
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
