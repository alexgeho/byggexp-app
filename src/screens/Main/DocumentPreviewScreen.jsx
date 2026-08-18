import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./DocumentPreviewScreen.styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [webLoading, setWebLoading] = useState(true);

  const document = route.params?.document || {};
  const sourceUrl = document?.url || "";
  const documentName =
    document?.name ||
    getDocumentNameFromUrl(sourceUrl, t("documentPreview.fallbackName"));
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
  const pdfPreviewUrl = useMemo(
    () => buildPdfPreviewUrl(sourceUrl),
    [sourceUrl],
  );

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadAndShareDocument({
        url: sourceUrl,
        fileName: documentName,
      });
    } catch (error) {
      console.error("Failed to download document:", error);
      Alert.alert(
        t("documentPreview.downloadFailedTitle"),
        t("documentPreview.downloadFailedMessage"),
      );
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
          <Icon name="arrow-left" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.actionsSpacer} />
        <TouchableOpacity
          onPress={handleDownload}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <Icon name="download" size={20} color={theme.colors.primary} />
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
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
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
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.primary}
                    />
                  </View>
                )}
                allowsInlineMediaPlayback={true}
                originWhitelist={["*"]}
              />
              {webLoading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
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
                {t("documentPreview.previewUnavailable")}
              </Text>
              <Text
                style={[
                  styles.unsupportedText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {t("documentPreview.unsupportedText")}
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
