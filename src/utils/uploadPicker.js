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

const normalizeImageAsset = (asset, fileNamePrefix, index) => ({
  uri: asset.uri,
  name:
    asset.fileName ||
    asset.name ||
    buildDefaultFileName(asset, fileNamePrefix, index),
  mimeType: asset.mimeType || "image/jpeg",
  type: asset.mimeType || "image/jpeg",
});

const ensureMediaLibraryAccess = async () => {
  let permission = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  if (!permission.granted) {
    Alert.alert(
      "Photo access needed",
      "Allow access to your photo library to upload images from Photos.",
    );
    return false;
  }

  return true;
};

const pickFromPhotoLibrary = async ({ allowsMultipleSelection, fileNamePrefix }) => {
  const hasAccess = await ensureMediaLibraryAccess();
  if (!hasAccess) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection,
    quality: 1,
    selectionLimit: allowsMultipleSelection ? 0 : 1,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset, index) =>
    normalizeImageAsset(asset, fileNamePrefix, index),
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
        onDismiss:
          Platform.OS === "android" ? () => finish(null) : undefined,
      },
    );
  });

export const pickUploadAssets = async ({
  allowsMultipleSelection = true,
  documentTypes = DEFAULT_DOCUMENT_TYPES,
  fileNamePrefix = DEFAULT_FILE_NAME_PREFIX,
} = {}) => {
  const source = await chooseSource();

  if (source === "photos") {
    return pickFromPhotoLibrary({
      allowsMultipleSelection,
      fileNamePrefix,
    });
  }

  if (source === "files") {
    return pickFromFiles({
      documentTypes,
      fileNamePrefix,
    });
  }

  return [];
};

export const IMAGE_DOCUMENT_TYPES = ["image/*"];
export const DEFAULT_UPLOAD_DOCUMENT_TYPES = DEFAULT_DOCUMENT_TYPES;
