import React from "react";
import { Modal, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

// Full-screen, tap-anywhere-to-dismiss image preview. Pass the image `uri`
// (null/empty hides the modal) and an `onClose` handler. Shared by the photo
// grids on the Project and Camera screens.
export const ImagePreviewModal = ({ uri, onClose }) => {
  const { t } = useTranslation();
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
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImagePreviewModal;
