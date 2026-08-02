async function refresh(row) {
  const body = new URLSearchParams({
    client_id: row.clientId,
    client_secret: row.clientSecret,
    refresh_token: row.refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google refresh failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in, 
  };
}
async function listFiles(token) {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", "'root' in parents and trashed = false");
  url.searchParams.set("fields", "files(id,name,mimeType,size,createdTime)");
  url.searchParams.set("pageSize", "1000"); 
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive list failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  const files = data.files || [];
  return files.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType || "",
    size: parseInt(f.size, 10) || 0,
    uploadedAt: new Date(f.createdTime).getTime(), 
  }));
}
async function viewFile(token, fileId) {
  const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    const text = await metaRes.text();
    throw new Error(`Google Drive metadata failed (${metaRes.status}): ${text}`);
  }
  const meta = await metaRes.json();
  const contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const contentRes = await fetch(contentUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentRes.ok) {
    const text = await contentRes.text();
    throw new Error(`Google Drive download failed (${contentRes.status}): ${text}`);
  }
  const buffer = Buffer.from(await contentRes.arrayBuffer());
  return {
    buffer,
    mimeType: meta.mimeType || "application/octet-stream",
    name: meta.name,
  };
}
async function uploadFile(token, buffer, fileName, mimeType) {
  const boundary = "----CloudFileDashboardBoundary" + Date.now();
  const metadata = JSON.stringify({ name: fileName, parents: ["root"] });
  const parts = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
  ];
  const header = Buffer.from(parts.join("\r\n") + "\r\n", "utf-8");
  const footer = Buffer.from(`\r\n--${boundary}--`, "utf-8");
  const body = Buffer.concat([header, buffer, footer]);
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType || "",
    size: parseInt(data.size, 10) || 0,
    uploadedAt: new Date(data.createdTime).getTime(),
  };
}
async function editFile(token, fileId, newName) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive rename failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType || "",
    size: parseInt(data.size, 10) || 0,
    uploadedAt: new Date(data.createdTime).getTime(),
  };
}
async function deleteFile(token, fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive delete failed (${res.status}): ${text}`);
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
