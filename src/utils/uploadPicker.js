import { Alert, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const DEFAULT_DOCUMENT_TYPES = [
  "image/*",
  "application/pdf",
  "text/*",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const DEFAULT_FILE_NAME_PREFIX = "upload";

const buildDefaultFileName = (asset, prefix, index) => {
  const extension = asset?.mimeType?.split("/")?.[1];
  return extension
    ? `${prefix}-${Date.now()}-${index + 1}.${extension}`
    : `${prefix}-${Date.now()}-${index + 1}`;
};

const guessMimeTypeFromName = (name = "") => {
  const extension = name.split(".").pop()?.toLowerCase();

  if (!extension) {
    return null;
  }

  if (["jpg", "jpeg"].includes(extension)) {
    return "image/jpeg";
  }

  if (["png", "gif", "webp", "heic", "bmp"].includes(extension)) {
    return `image/${extension === "jpg" ? "jpeg" : extension}`;
  }

  if (["mp4", "mov", "m4v", "webm", "avi", "mkv"].includes(extension)) {
    const mimeExtension =
      extension === "mov"
        ? "quicktime"
        : extension === "mkv"
          ? "x-matroska"
          : extension;
    return `video/${mimeExtension}`;
  }

  return null;
};

const normalizeMediaAsset = (asset, fileNamePrefix, index) => {
  const name =
    asset.fileName ||
    asset.name ||
    buildDefaultFileName(asset, fileNamePrefix, index);
  const mimeType =
    asset.mimeType ||
    guessMimeTypeFromName(name) ||
    (asset.type === "video" ? "video/mp4" : "image/jpeg");

  return {
    uri: asset.uri,
    name,
    mimeType,
    type: mimeType,
  };
};

const ensureMediaLibraryAccess = async () => {
  let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  if (!permission.granted) {
    Alert.alert(
      "Photo access needed",
      "Allow access to your photo library to upload images or videos from Photos.",
    );
    return false;
  }

  return true;
};

const pickFromPhotoLibrary = async ({
  allowsMultipleSelection,
  fileNamePrefix,
  allowVideos = false,
}) => {
  const hasAccess = await ensureMediaLibraryAccess();
  if (!hasAccess) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: allowVideos
      ? ImagePicker.MediaTypeOptions.All
      : ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection,
    quality: 1,
    selectionLimit: allowsMultipleSelection ? 0 : 1,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset, index) =>
    normalizeMediaAsset(asset, fileNamePrefix, index),
  );
};

const pickFromFiles = async ({ documentTypes, fileNamePrefix }) => {
  const result = await DocumentPicker.getDocumentAsync({
    type: documentTypes,
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset, index) => ({
    uri: asset.uri,
    name: asset.name || buildDefaultFileName(asset, fileNamePrefix, index),
    mimeType: asset.mimeType || asset.type || "application/octet-stream",
    type: asset.mimeType || asset.type || "application/octet-stream",
  }));
};

const chooseSource = () =>
  new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    Alert.alert(
      "Select source",
      "Choose where you want to pick files from.",
      [
        {
          text: "Photos",
          onPress: () => finish("photos"),
        },
        {
          text: "Files",
          onPress: () => finish("files"),
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => finish(null),
        },
      ],
      {
        cancelable: true,
        onDismiss: Platform.OS === "android" ? () => finish(null) : undefined,
      },
    );
  });

export const pickUploadAssets = async ({
  allowsMultipleSelection = true,
  documentTypes = DEFAULT_DOCUMENT_TYPES,
  fileNamePrefix = DEFAULT_FILE_NAME_PREFIX,
  allowVideos = false,
} = {}) => {
  const source = await chooseSource();
  const resolvedDocumentTypes = allowVideos
    ? Array.from(new Set([...documentTypes, "video/*"]))
    : documentTypes;

  if (source === "photos") {
    return pickFromPhotoLibrary({
      allowsMultipleSelection,
      fileNamePrefix,
      allowVideos,
    });
  }

  if (source === "files") {
    return pickFromFiles({
      documentTypes: resolvedDocumentTypes,
      fileNamePrefix,
    });
  }

  return [];
};

const ensureCameraAccess = async () => {
  let permission = await ImagePicker.getCameraPermissionsAsync();

  if (!permission.granted) {
    permission = await ImagePicker.requestCameraPermissionsAsync();
  }

  if (!permission.granted) {
    Alert.alert("Camera access needed", "Allow camera access to take a photo.");
    return false;
  }

  return true;
};

// Take a single photo with the camera. Returns normalized assets ([] if cancelled).
export const pickFromCamera = async ({
  fileNamePrefix = DEFAULT_FILE_NAME_PREFIX,
} = {}) => {
  const hasAccess = await ensureCameraAccess();
  if (!hasAccess) {
    return [];
  }

  const result = await ImagePicker.launchCameraAsync({ quality: 1 });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset, index) =>
    normalizeMediaAsset(asset, fileNamePrefix, index),
  );
};

// Pick one or more files/documents (images, PDFs, docs…).
export const pickDocuments = ({
  documentTypes = DEFAULT_DOCUMENT_TYPES,
  fileNamePrefix = DEFAULT_FILE_NAME_PREFIX,
} = {}) => pickFromFiles({ documentTypes, fileNamePrefix });

export const isVideoAsset = (asset) => {
  const mimeType = asset?.mimeType || asset?.type || "";
  if (mimeType.startsWith("video/")) {
    return true;
  }

  const name = (asset?.name || asset?.uri || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/i.test(name);
};

export const IMAGE_DOCUMENT_TYPES = ["image/*"];
export const IMAGE_AND_VIDEO_DOCUMENT_TYPES = ["image/*", "video/*"];
