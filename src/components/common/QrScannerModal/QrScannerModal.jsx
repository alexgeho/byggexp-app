import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";

import { BackButton } from "../BackButton/BackButton";
import { styles } from "../../../screens/Menu/ToolScanScreen.styles";

// Camera sheet that reads one QR code and hands the raw string back. Same
// framing/permission flow as ToolScanScreen — that screen looks the scanned
// tool up, this one just returns the code (used when registering a tool from
// the label already stuck on it).
export function QrScannerModal({ visible, onClose, onScanned, title, hint }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const lockRef = useRef(false);
  const [scanning, setScanning] = useState(false);

  const handleScan = useCallback(
    ({ data }) => {
      if (lockRef.current || !data) {
        return;
      }
      lockRef.current = true;
      setScanning(true);
      onScanned(String(data).trim());
      // Unlock for the next open; the modal closes on the caller's side.
      lockRef.current = false;
      setScanning(false);
    },
    [onScanned],
  );

  const renderHeader = (dark) => (
    <View style={styles.header}>
      <BackButton
        backgroundColor={
          dark ? "rgba(255,255,255,0.15)" : "rgba(255, 255, 255, 0.6)"
        }
        tint={dark ? "dark" : "light"}
        borderColor="#FFFFFF50"
        onPress={onClose}
        iconSource={require("../../../assets/Arrow-left.png")}
      />
      <Text style={[styles.title, dark && { color: "#fff" }]}>
        {title || t("toolScan.title")}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );

  const renderBody = () => {
    if (!permission) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0785F4" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerScreen}>
          {renderHeader(false)}
          <View style={styles.center}>
            <Text style={styles.permTitle}>
              {t("camera.cameraAccessTitle")}
            </Text>
            <Text style={styles.permText}>{t("toolScan.permText")}</Text>
            <TouchableOpacity
              style={styles.permBtn}
              onPress={
                permission.canAskAgain
                  ? requestPermission
                  : () => Linking.openSettings()
              }
            >
              <Text style={styles.permBtnText}>
                {permission.canAskAgain
                  ? t("toolScan.allowCamera")
                  : t("camera.openSettings")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleScan}
        />
        <View style={styles.overlay} pointerEvents="box-none">
          {renderHeader(true)}
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={styles.hint}>
              {scanning ? t("toolScan.reading") : hint || t("toolScan.aimHint")}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {renderBody()}
    </Modal>
  );
}

export default QrScannerModal;
