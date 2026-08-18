import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./ToolScanScreen.styles";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { toolService } from "../../services";
import ToolActionSheet from "./ToolActionSheet";

export default function ToolScanScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [tool, setTool] = useState(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState("");
  const lockRef = useRef(false);

  const handleScan = useCallback(
    async ({ data }) => {
      if (lockRef.current || !data) return;
      lockRef.current = true;
      setLooking(true);
      setError("");
      try {
        const found = await toolService.scanByQr(String(data).trim());
        setTool(found);
      } catch (e) {
        setError(
          e?.response?.status === 404
            ? t("toolScan.notFound", { code: String(data).trim() })
            : t("toolScan.readError"),
        );
        // allow re-scan after a short cooldown
        setTimeout(() => {
          lockRef.current = false;
        }, 1500);
      } finally {
        setLooking(false);
      }
    },
    [t],
  );

  const closeSheet = (updated) => {
    setTool(null);
    lockRef.current = false; // resume scanning
    if (updated) {
      // keep it simple: return to the list which refetches on focus
    }
  };

  const renderHeader = (dark) => (
    <View style={styles.header}>
      <BackButton
        backgroundColor={
          dark ? "rgba(255,255,255,0.15)" : "rgba(255, 255, 255, 0.6)"
        }
        tint={dark ? "dark" : "light"}
        borderColor="#FFFFFF50"
        onPress={() => navigation.goBack()}
        iconSource={require("../../assets/Arrow-left.png")}
      />
      <Text style={[styles.title, dark && { color: "#fff" }]}>
        {t("toolScan.title")}
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );

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
          <Text style={styles.permTitle}>{t("camera.cameraAccessTitle")}</Text>
          <Text style={styles.permText}>{t("toolScan.permText")}</Text>
          {permission.canAskAgain ? (
            <TouchableOpacity
              style={styles.permBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permBtnText}>
                {t("toolScan.allowCamera")}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.permBtn}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.permBtnText}>{t("camera.openSettings")}</Text>
            </TouchableOpacity>
          )}
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
        onBarcodeScanned={tool ? undefined : handleScan}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        {renderHeader(true)}
        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>
            {looking ? t("toolScan.reading") : t("toolScan.aimHint")}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>

      <ToolActionSheet
        visible={!!tool}
        tool={tool}
        onClose={() => closeSheet(false)}
        onUpdated={(updated) => {
          setTool(updated);
        }}
      />
    </View>
  );
}
