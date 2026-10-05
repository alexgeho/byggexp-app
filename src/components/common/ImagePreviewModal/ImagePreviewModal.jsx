import React from "react";
import { Modal, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";

// Full-screen, tap-anywhere-to-dismiss image preview. Pass the image `uri`
// (null/empty hides the modal) and an `onClose` handler. Shared by the photo
// grids on the Project and Camera screens. Optional `onDelete` shows a trash
// button in the top-right corner.
export const ImagePreviewModal = ({ uri, onClose, onDelete }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("a11y.close")}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : null}
        {onDelete ? (
          <TouchableOpacity
            style={[styles.deleteButton, { top: insets.top + 8 }]}
            onPress={onDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.delete")}
          >
            <Icon name="trash-2" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  deleteButton: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImagePreviewModal;
