import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Video, ResizeMode } from "expo-av";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { useFeedback } from "../../contexts/FeedbackContext";
import { bugReportService } from "../../services";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";
import {
  IMAGE_AND_VIDEO_DOCUMENT_TYPES,
  isVideoAsset,
  pickUploadAssets,
} from "../../utils/uploadPicker";

export default function ReportBugScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { showSuccess } = useFeedback();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [saving, setSaving] = useState(false);
  const attachmentIsVideo = isVideoAsset(attachment);

  const pickAttachment = async () => {
    try {
      const assets = await pickUploadAssets({
        allowsMultipleSelection: false,
        documentTypes: IMAGE_AND_VIDEO_DOCUMENT_TYPES,
        fileNamePrefix: "bug-report",
        allowVideos: true,
      });

      if (assets.length > 0) {
        setAttachment(assets[0]);
      }
    } catch (error) {
      console.error("Error picking bug report attachment:", error);
      Alert.alert(
        t("reportBug.attachmentErrorTitle"),
        t("reportBug.attachmentErrorMessage"),
      );
    }
  };

  const submitBugReport = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !attachment) {
      Alert.alert(
        t("reportBug.validationTitle"),
        t("reportBug.validationMessage"),
      );
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();

      if (trimmedMessage) {
        formData.append("message", trimmedMessage);
      }

      if (attachment) {
        const isVideo = isVideoAsset(attachment);
        formData.append("attachment", {
          uri: attachment.uri,
          name:
            attachment.name || (isVideo ? "bug-report.mp4" : "bug-report.jpg"),
          type:
            attachment.mimeType ||
            attachment.type ||
            (isVideo ? "video/mp4" : "image/jpeg"),
        });
      }

      await bugReportService.create(formData);
      showSuccess({
        title: t("reportBug.sentTitle"),
        message: t("reportBug.sentMessage"),
      });
      navigation.navigate("Menu");
    } catch (error) {
      console.error("Error submitting bug report:", error);
      Alert.alert(
        t("common.error"),
        error?.response?.data?.message ||
          error?.message ||
          t("reportBug.sendError"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF"
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {t("reportBug.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIconWrap,
              { backgroundColor: `${theme.colors.primary}1A` },
            ]}
          >
            <Icon name="alert-circle" size={32} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("reportBug.heroTitle")}
          </Text>
          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("reportBug.heroText")}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>
            {t("reportBug.descriptionLabel")}
          </Text>
          <TextInput
            multiline={true}
            value={message}
            onChangeText={setMessage}
            placeholder={t("reportBug.descriptionPlaceholder")}
            placeholderTextColor="rgba(5, 45, 80, 0.45)"
            style={styles.textArea}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={pickAttachment}
            activeOpacity={0.85}
          >
            <Icon
              name={attachmentIsVideo ? "video" : "image"}
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.attachmentButtonText}>
              {attachment
                ? attachmentIsVideo
                  ? t("reportBug.changeVideo")
                  : t("reportBug.changeImage")
                : t("reportBug.attach")}
            </Text>
          </TouchableOpacity>

          {attachment ? (
            <View style={styles.attachmentPreview}>
              {attachmentIsVideo ? (
                <Video
                  source={{ uri: attachment.uri }}
                  style={styles.previewMedia}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                />
              ) : (
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.previewMedia}
                />
              )}
              <View style={styles.attachmentInfo}>
                <Text numberOfLines={1} style={styles.attachmentName}>
                  {attachment.name ||
                    (attachmentIsVideo
                      ? t("reportBug.selectedVideo")
                      : t("reportBug.selectedImage"))}
                </Text>
                <TouchableOpacity onPress={() => setAttachment(null)}>
                  <Text style={styles.removeAttachmentText}>
                    {t("reportBug.remove")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={submitBugReport}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t("reportBug.send")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    placeholder: {
      ...standardScreenHeaderPlaceholder,
    },
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      gap: 12,
      paddingBottom: 120,
    },
    heroCard: {
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 20,
      alignItems: "center",
    },
    heroIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroTitle: {
      color: c.textPrimary,
      fontSize: 24,
      marginBottom: 8,
      textAlign: "center",
    },
    heroText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    formCard: {
      width: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      padding: 18,
    },
    inputLabel: {
      color: c.textMuted,
      fontSize: 12,
      marginBottom: 8,
    },
    textArea: {
      minHeight: 130,
      color: c.textPrimary,
      fontSize: 16,
      padding: 0,
    },
    attachmentButton: {
      marginTop: 18,
      height: 44,
      borderRadius: 16,
      backgroundColor: "rgba(0, 145, 255, 0.1)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    attachmentButtonText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    attachmentPreview: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    previewMedia: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor: "#EFEFF0",
    },
    attachmentInfo: {
      flex: 1,
    },
    attachmentName: {
      color: c.textPrimary,
      fontSize: 14,
      marginBottom: 6,
    },
    removeAttachmentText: {
      color: "#D92D20",
      fontSize: 13,
      fontWeight: "600",
    },
    submitButton: {
      height: 54,
      borderRadius: 18,
      backgroundColor: "#0091FF",
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
