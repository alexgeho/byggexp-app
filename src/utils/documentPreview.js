import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getToken } from "./storage";

export const getDocumentNameFromUrl = (url, fallback = "Document") => {
  if (!url) {
    return fallback;
  }

  try {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/");
    return decodeURIComponent(parts[parts.length - 1] || fallback);
  } catch (_error) {
    return fallback;
  }
};

export const getFileExtension = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const isPdfDocument = ({ mimeType = "", name = "", url = "" } = {}) => {
  const extension = getFileExtension(name || getDocumentNameFromUrl(url));
  return mimeType.includes("pdf") || extension === "pdf";
};

export const isImageDocument = ({ mimeType = "", name = "", url = "" } = {}) => {
  const extension = getFileExtension(name || getDocumentNameFromUrl(url));
  return (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(extension)
  );
};

export const buildPdfPreviewUrl = (url) => {
  if (!url) {
    return "";
  }

  if (Platform.OS === "android") {
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
  }

  return url;
};

const sanitizeFileName = (value) =>
  String(value || "document")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";

export const downloadAndShareDocument = async ({ url, fileName }) => {
  if (!url) {
    throw new Error("Document url is missing.");
  }

  const baseDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("Local file storage is unavailable on this device.");
  }

  const token = await getToken();
  const targetPath = `${baseDirectory}${sanitizeFileName(fileName || getDocumentNameFromUrl(url))}`;
  const downloadResult = await FileSystem.downloadAsync(url, targetPath, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (downloadResult.status < 200 || downloadResult.status >= 300) {
    throw new Error("Failed to download document.");
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(downloadResult.uri, {
      dialogTitle: "Download document",
    });
  }

  return downloadResult;
};
