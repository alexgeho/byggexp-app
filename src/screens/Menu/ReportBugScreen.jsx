import React, { useState } from "react";
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
import { IMAGE_DOCUMENT_TYPES, pickUploadAssets } from "../../utils/uploadPicker";

export default function ReportBugScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [saving, setSaving] = useState(false);

  const pickAttachment = async () => {
    try {
      const assets = await pickUploadAssets({
        allowsMultipleSelection: false,
        documentTypes: IMAGE_DOCUMENT_TYPES,
        fileNamePrefix: "bug-report",
      });

      if (assets.length > 0) {
        setAttachment(assets[0]);
      }
    } catch (error) {
      console.error("Error picking bug report attachment:", error);
      Alert.alert("Attachment error", "Unable to select an image right now.");
    }
  };

  const submitBugReport = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !attachment) {
      Alert.alert("Validation error", "Add a description or attach an image.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();

      if (trimmedMessage) {
        formData.append("message", trimmedMessage);
      }

      if (attachment) {
        formData.append("attachment", {
          uri: attachment.uri,
          name: attachment.name || "bug-report.jpg",
          type: attachment.mimeType || attachment.type || "image/jpeg",
        });
      }

      await bugReportService.create(formData);
      showSuccess({
        title: "Report sent",
        message: "Thank you. We will review the issue.",
      });
      navigation.navigate("Menu");
    } catch (error) {
      console.error("Error submitting bug report:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || error?.message || "Failed to send report.",
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
          Report a bug
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
            Tell us what went wrong
          </Text>
          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Send a short description, a screenshot, or both. It helps us fix
            issues faster.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            multiline={true}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe the problem"
            placeholderTextColor="rgba(5, 45, 80, 0.45)"
            style={styles.textArea}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={pickAttachment}
            activeOpacity={0.85}
          >
            <Icon name="image" size={18} color={theme.colors.primary} />
            <Text style={styles.attachmentButtonText}>
              {attachment ? "Change image" : "Attach image"}
            </Text>
          </TouchableOpacity>

          {attachment ? (
            <View style={styles.attachmentPreview}>
              <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
              <View style={styles.attachmentInfo}>
                <Text numberOfLines={1} style={styles.attachmentName}>
                  {attachment.name || "Selected image"}
                </Text>
                <TouchableOpacity onPress={() => setAttachment(null)}>
                  <Text style={styles.removeAttachmentText}>Remove</Text>
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
            <Text style={styles.submitButtonText}>Send report</Text>
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

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
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
    color: "#052D50",
    fontSize: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  heroText: {
    color: "#698196",
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
    color: "#698196",
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 130,
    color: "#052D50",
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
    color: "#052D50",
    fontSize: 15,
    fontWeight: "600",
  },
  attachmentPreview: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#EFEFF0",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    color: "#052D50",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
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
