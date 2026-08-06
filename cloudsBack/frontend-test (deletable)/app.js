let selectedProvider = null;
let currentFiles = [];
let renameFileId = null;
window.addEventListener("DOMContentLoaded", () => {
  checkBackend();
  loadProviders();
  setupUploadZone();
  setupEventListeners();
  setupOAuthListener();
});
function setupOAuthListener() {
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== "oauth") return;
    if (data.ok) {
      showToast("✓ Account connected", "success");
      loadProviders();
    } else {
      showToast(data.message || "Sign-in failed", "error");
    }
  });
}
async function checkBackend() {
  const statusEl = document.getElementById("apiStatus");
  try {
    const res = await fetch(`${API_BASE}/providers`);
    if (res.ok) {
      statusEl.textContent = "Backend connected";
      statusEl.classList.add("online");
    } else {
      statusEl.textContent = "Backend error";
      statusEl.classList.add("offline");
    }
  } catch (err) {
    statusEl.textContent = "Backend offline";
    statusEl.classList.add("offline");
    showToast("Cannot reach backend at " + API_BASE, "error");
  }
}
async function loadProviders() {
  const container = document.getElementById("providers");
  try {
    const res = await fetch(`${API_BASE}/providers`);
    const data = await res.json();
    container.innerHTML = "";
    data.providers.forEach((p) => {
      const card = document.createElement("div");
      card.className = `provider-card ${!p.connected ? "disconnected" : ""}`;
      let statusHtml;
      if (p.connected) {
        const who = p.email || p.accountName || "connected account";
        statusHtml = `<div class="provider-status connected">✓ ${escapeHtml(who)}</div>`;
      } else if (p.configured) {
        statusHtml = `<div class="provider-status">Not connected</div>`;
      } else {
        statusHtml = `<div class="provider-status">Not set up (missing client id/secret)</div>`;
      }
      const actionHtml = p.connected
        ? `<button class="btn btn-secondary provider-btn" data-action="logout" data-provider="${p.name}">Logout</button>`
        : `<button class="btn btn-primary provider-btn" data-action="connect" data-provider="${p.name}" ${p.configured ? "" : "disabled"}>Connect</button>`;
      card.innerHTML = `
        <div class="provider-head">
          <div class="provider-name">${p.name}</div>
          ${actionHtml}
        </div>
        ${statusHtml}
      `;
      if (p.connected) {
        card.onclick = (e) => {
          if (e.target.closest(".provider-btn")) return; 
          selectProvider(p.name, card);
        };
      }
      const btn = card.querySelector(".provider-btn");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (btn.dataset.action === "connect") connectProvider(p.name);
          else logoutProvider(p.name);
        });
      }
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger); font-size: 14px;">Failed to load providers</p>`;
  }
}
function selectProvider(name, card) {
  selectedProvider = name;
  document.querySelectorAll(".provider-card").forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  document.getElementById("refreshBtn").disabled = false;
  document.getElementById("uploadBtn").disabled = false;
  document.getElementById("uploadTarget").textContent = name;
  listFiles();
}
function connectProvider(name) {
  const w = 500;
  const h = 640;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const url = `${API_BASE}/${name}/auth/start`;
  const popup = window.open(
    url,
    "oauth_" + name,
    `width=${w},height=${h},left=${left},top=${top}`
  );
  if (!popup) {
    showToast("Popup blocked. Allow popups for this site and try again.", "error");
  }
}
async function logoutProvider(name) {
  if (!confirm(`Log out of ${name}? You can connect a different account after.`)) return;
  try {
    const res = await fetch(`${API_BASE}/${name}/logout`, { method: "POST" });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, "error");
      return;
    }
    showToast(`✓ Logged out of ${name}`, "success");
    if (selectedProvider === name) {
      selectedProvider = null;
      currentFiles = [];
      document.getElementById("refreshBtn").disabled = true;
      document.getElementById("uploadBtn").disabled = true;
      document.getElementById("uploadTarget").textContent = "…";
      document.getElementById("fileCount").textContent = "";
      document.getElementById("fileArea").innerHTML =
        '<div class="empty-state"><span class="empty-icon">📂</span><p>Select a provider to see your files.</p></div>';
    }
    loadProviders();
  } catch (err) {
    showToast("Logout failed: " + err.message, "error");
  }
}
async function listFiles() {
  if (!selectedProvider) return;
  const type = document.getElementById("fileType").value;
  const order = document.getElementById("sortOrder").value;
  const query = new URLSearchParams({ type, order }).toString();
  const fileArea = document.getElementById("fileArea");
  fileArea.innerHTML = '<div class="empty-state"><span class="empty-icon">⏳</span><p>Loading…</p></div>';
  try {
    const res = await fetch(`${API_BASE}/${selectedProvider}/files?${query}`);
    const data = await res.json();
    if (data.error) {
      fileArea.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>${data.error}</p></div>`;
      return;
    }
    currentFiles = data.files;
    document.getElementById("fileCount").textContent = `${data.count} file${data.count !== 1 ? "s" : ""}`;
    if (data.files.length === 0) {
      fileArea.innerHTML = '<div class="empty-state"><span class="empty-icon">📂</span><p>No files found.</p></div>';
      return;
    }
    const grid = document.createElement("div");
    grid.className = "file-grid";
    data.files.forEach((f) => {
      const card = document.createElement("div");
      card.className = "file-card";
      card.onclick = () => viewFile(f.id, f.name);
      card.innerHTML = `
        <span class="file-icon">${getFileIcon(f.category)}</span>
        <div class="file-name">${escapeHtml(f.name)}</div>
        <div class="file-meta">${f.category} • ${formatSize(f.size)}</div>
        <div class="file-meta">${new Date(f.uploadedAt).toLocaleDateString()}</div>
        <div class="file-id">ID: ${f.id}</div>
        <div class="file-actions" onclick="event.stopPropagation()">
          <button class="btn btn-secondary" onclick="openRename('${f.id}', '${escapeHtml(f.name).replace(/'/g, "\\'")}')">Rename</button>
          <button class="btn btn-danger" onclick="deleteFile('${f.id}', '${escapeHtml(f.name).replace(/'/g, "\\'")}')">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
    fileArea.innerHTML = "";
    fileArea.appendChild(grid);
  } catch (err) {
    fileArea.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Error: ${err.message}</p></div>`;
  }
}
function setupUploadZone() {
  const dropZone = document.getElementById("dropZone");
  const input = document.getElementById("uploadFile");
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      updateDropText();
    }
  });
  input.addEventListener("change", updateDropText);
}
function updateDropText() {
  const input = document.getElementById("uploadFile");
  const text = document.getElementById("dropText");
  if (input.files[0]) {
    text.textContent = input.files[0].name;
  } else {
    text.textContent = "Click or drop a file here";
  }
}
document.getElementById("uploadBtn").addEventListener("click", async () => {
  if (!selectedProvider) return showToast("Select a provider first", "error");
  const input = document.getElementById("uploadFile");
  if (!input.files[0]) return showToast("Choose a file first", "error");
  const formData = new FormData();
  formData.append("file", input.files[0]);
  try {
    const res = await fetch(`${API_BASE}/${selectedProvider}/files`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, "error");
    } else {
      showToast(`✓ Uploaded: ${data.file.name}`, "success");
      input.value = "";
      updateDropText();
      listFiles();
    }
  } catch (err) {
    showToast("Upload failed: " + err.message, "error");
  }
});
function viewFile(id, name) {
  if (!selectedProvider) return;
  const url = `${API_BASE}/${selectedProvider}/files/${id}/view`;
  window.open(url, "_blank");
}
function openRename(id, name) {
  renameFileId = id;
  document.getElementById("renameCurrent").textContent = `Current name: ${name}`;
  document.getElementById("renameInput").value = name;
  document.getElementById("renameModal").classList.remove("hidden");
  document.getElementById("renameInput").focus();
  document.getElementById("renameInput").select();
}
function closeRename() {
  document.getElementById("renameModal").classList.add("hidden");
  renameFileId = null;
}
async function submitRename() {
  if (!selectedProvider || !renameFileId) return;
  const newName = document.getElementById("renameInput").value.trim();
  if (!newName) return showToast("Enter a new name", "error");
  try {
    const res = await fetch(`${API_BASE}/${selectedProvider}/files/${renameFileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, "error");
    } else {
      showToast(`✓ Renamed to: ${data.file.name}`, "success");
      closeRename();
      listFiles();
    }
  } catch (err) {
    showToast("Rename failed: " + err.message, "error");
  }
}
async function deleteFile(id, name) {
  if (!selectedProvider) return;
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/${selectedProvider}/files/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, "error");
    } else {
      showToast("✓ File deleted", "success");
      listFiles();
    }
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}
function setupEventListeners() {
  document.getElementById("fileType").addEventListener("change", () => {
    if (selectedProvider) listFiles();
  });
  document.getElementById("sortOrder").addEventListener("change", () => {
    if (selectedProvider) listFiles();
  });
  document.getElementById("refreshBtn").addEventListener("click", () => {
    if (selectedProvider) listFiles();
  });
  document.getElementById("renameModal").addEventListener("click", (e) => {
    if (e.target.id === "renameModal") closeRename();
  });
  document.getElementById("renameInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") closeRename();
  });
}
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
function getFileIcon(category) {
  const icons = {
    image: "🖼️",
    video: "🎬",
    audio: "🎵",
    document: "📄",
    archive: "📦",
    other: "📎",
  };
  return icons[category] || icons.other;
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
