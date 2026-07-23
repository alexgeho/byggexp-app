import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeContext";
import {
  buildPdfPreviewUrl,
  downloadAndShareDocument,
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../utils/documentPreview";

export default function DocumentPreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);

  const document = route.params?.document || {};
  const sourceUrl = document?.url || "";
  const documentName = document?.name || getDocumentNameFromUrl(sourceUrl, "Document");
  const mimeType = document?.mimeType || "";

  const showImagePreview = isImageDocument({
    mimeType,
    name: documentName,
    url: sourceUrl,
  });
  const showPdfPreview = isPdfDocument({
    mimeType,
    name: documentName,
    url: sourceUrl,
  });
  const pdfPreviewUrl = useMemo(() => buildPdfPreviewUrl(sourceUrl), [sourceUrl]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadAndShareDocument({
        url: sourceUrl,
        fileName: documentName,
      });
    } catch (error) {
      console.error("Failed to download document:", error);
      Alert.alert("Download failed", "Unable to download this document right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.actionsRow,
          {
            paddingTop: Math.max(insets.top, 20),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <Icon
            name="arrow-left"
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.actionsSpacer} />
        <TouchableOpacity
          onPress={handleDownload}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <Icon
            name="download"
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[
            styles.fileName,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {documentName}
        </Text>

        <View style={styles.previewCard}>
          {showImagePreview ? (
            <>
              <Image
                source={{ uri: sourceUrl }}
                style={styles.imagePreview}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
              />
              {imageLoading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : null}
            </>
          ) : null}

          {showPdfPreview ? (
            <>
              <WebView
                source={{ uri: pdfPreviewUrl }}
                style={styles.webview}
                startInLoadingState={true}
                onLoadEnd={() => setWebLoading(false)}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                originWhitelist={["*"]}
              />
              {webLoading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : null}
            </>
          ) : null}

          {!showImagePreview && !showPdfPreview ? (
            <View style={styles.unsupportedWrap}>
              <Text
                style={[
                  styles.unsupportedTitle,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                Preview unavailable
              </Text>
              <Text
                style={[
                  styles.unsupportedText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                This file type cannot be previewed yet. Use the download button to
                open or share it.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.downloadOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1723",
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  fileName: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 44,
  },
  previewCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0B1723",
  },
  webview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 23, 35, 0.16)",
  },
  unsupportedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  unsupportedTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 8,
  },
  unsupportedText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 23, 35, 0.28)",
  },
});
