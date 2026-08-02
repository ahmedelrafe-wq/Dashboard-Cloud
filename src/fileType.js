const extensions = {
  image: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "heic"],
  video: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"],
  audio: ["mp3", "wav", "ogg", "flac", "m4a", "aac"],
  document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md"],
  archive: ["zip", "rar", "7z", "tar", "gz"],
};
function categoryOf(mimeType, name) {
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  const dot = (name || "").lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  for (const category of Object.keys(extensions)) {
    if (extensions[category].includes(ext)) {
      return category;
    }
  }
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("sheet") ||
      mime.includes("presentation") || mime.includes("text")) {
    return "document";
  }
  if (mime.includes("zip") || mime.includes("compressed")) {
    return "archive";
  }
  return "other";
}
function filterByType(files, type) {
  if (!type) return files;
  const wanted = type.toLowerCase();
  return files.filter((f) => categoryOf(f.mimeType, f.name) === wanted);
}
module.exports = { categoryOf, filterByType };
