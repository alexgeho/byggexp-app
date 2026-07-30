import React, { useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/Feather";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import FloatingActionButton from "../../components/common/FloatingActionButton/FloatingActionButton";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../styles/screenLayout";
import {
  getDocumentNameFromUrl,
  isImageDocument as isPreviewImageDocument,
  isPdfDocument,
} from "../../utils/documentPreview";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { userService } from "../../services";
import { API_BASE_URL } from "../../config/env";

const parseOptionalNumber = (value) => {
  const normalized = String(value || "").replace(/\D/g, "");
  return normalized ? parseInt(normalized, 10) : undefined;
};

const resolveImageUrl = (value) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const getDocumentName = (value, index) => {
  if (!value) {
    return `Document ${index + 1}`;
  }

  const parts = value.split("/");
  return parts[parts.length - 1] || `Document ${index + 1}`;
};

const getFileExtension = (fileName = "") => {
  const cleanName = fileName.split("?")[0];
  const parts = cleanName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
};

const isImageDocument = (documentUrl) => {
  const extension = getFileExtension(
    getDocumentName(documentUrl, 0),
  ).toLowerCase();
  return ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(
    extension,
  );
};

const getDocumentTypeMeta = (documentUrl) => {
  const extension = getFileExtension(getDocumentName(documentUrl, 0));

  if (isImageDocument(documentUrl)) {
    return { icon: "image", label: extension || "IMAGE" };
  }

  if (extension === "PDF") {
    return { icon: "file-text", label: "PDF" };
  }

  if (["DOC", "DOCX", "TXT", "RTF"].includes(extension)) {
    return { icon: "file-text", label: extension || "DOC" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { icon: "grid", label: extension || "XLS" };
  }

  return { icon: "file", label: extension || "FILE" };
};

export const MyAccount = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const navigation = useNavigation();
  const { user, userId, updateStoredUser, logout } = useContext(AuthContext);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    name: "",
    profession: "",
    email: "",
    phoneAreaCode: "",
    phoneNumber: "",
  });

  const profileId = userId || user?._id || user?.id || null;
  const activeRole = profile?.role || user?.role;

  const getRoleInfo = () => {
    switch (activeRole) {
      case "superadmin":
        return {
          title: t("roles.superadmin"),
          icon: require("../../assets/Account.png"),
          color: "#9C27B0",
        };
      case "companyAdmin":
        return {
          title: t("roles.companyAdmin"),
          icon: require("../../assets/About.png"),
          color: "#009688",
        };
      case "projectAdmin":
        return {
          title: t("roles.projectAdmin"),
          icon: require("../../assets/Tracker.png"),
          color: "#7E57C2",
        };
      case "worker":
        return {
          title: t("roles.worker"),
          icon: require("../../assets/Tasks.png"),
          color: "#00C853",
        };
      default:
        return {
          title: activeRole || t("myAccount.unknownRole"),
          icon: require("../../assets/Account.png"),
          color: "#9C27B0",
        };
    }
  };

  const roleInfo = useMemo(() => getRoleInfo(), [activeRole, t]);

  const applyProfileToForm = useCallback((userData) => {
    setForm({
      name: userData?.name || "",
      profession: userData?.profession || "",
      email: userData?.email || "",
      phoneAreaCode: userData?.phoneAreaCode
        ? String(userData.phoneAreaCode)
        : "",
      phoneNumber: userData?.phoneNumber ? String(userData.phoneNumber) : "",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await userService.getById(profileId);
      setProfile(userData);
      applyProfileToForm(userData);
    } catch (error) {
      console.error("Failed to load account:", error);
      Alert.alert(t("myAccount.loadErrorTitle"), t("project.openErrorMessage"));
    } finally {
      setLoading(false);
    }
  }, [applyProfileToForm, profileId, t]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleChangeAvatar = async () => {
    if (!profileId) {
      Alert.alert(
        t("myAccount.avatarErrorTitle"),
        t("myAccount.userIdMissing"),
      );
      return;
    }

    try {
      setUploadingAvatar(true);
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          t("myAccount.permissionTitle"),
          t("myAccount.permissionAvatar"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const updatedUser = await userService.uploadAvatar(profileId, {
        uri: asset.uri,
        name: asset.fileName || asset.fileName || `avatar-${Date.now()}.jpg`,
        mimeType: asset.mimeType || asset.type || "image/jpeg",
        type: asset.mimeType || asset.type || "image/jpeg",
      });

      setProfile(updatedUser);
      applyProfileToForm(updatedUser);
      await updateStoredUser({
        ...(user || {}),
        ...updatedUser,
        id: updatedUser?._id || updatedUser?.id || profileId,
      });
      showSuccess({
        title: t("myAccount.avatarUpdated"),
        message: t("myAccount.avatarUpdatedMessage"),
      });
    } catch (error) {
      console.error("Failed to update avatar:", error);
      Alert.alert(
        t("myAccount.avatarErrorTitle"),
        error?.response?.data?.message || t("project.openErrorMessage"),
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!profileId) {
      Alert.alert(t("myAccount.saveErrorTitle"), t("myAccount.userIdMissing"));
      return;
    }

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      Alert.alert(
        t("myAccount.nameRequiredTitle"),
        t("myAccount.nameRequiredMessage"),
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        profession: form.profession.trim(),
      };
      const phoneAreaCode = parseOptionalNumber(form.phoneAreaCode);
      const phoneNumber = parseOptionalNumber(form.phoneNumber);

      if (phoneAreaCode !== undefined) {
        payload.phoneAreaCode = phoneAreaCode;
      }

      if (phoneNumber !== undefined) {
        payload.phoneNumber = phoneNumber;
      }

      const updatedUser = await userService.update(profileId, payload);

      setProfile(updatedUser);
      applyProfileToForm(updatedUser);
      await updateStoredUser({
        ...(user || {}),
        ...updatedUser,
        id: updatedUser?._id || updatedUser?.id || profileId,
      });
      showSuccess({
        title: t("myAccount.profileUpdated"),
        message: t("myAccount.profileUpdatedMessage"),
      });
    } catch (error) {
      console.error("Failed to update account:", error);
      Alert.alert(
        t("myAccount.saveErrorTitle"),
        error?.response?.data?.message || t("project.openErrorMessage"),
      );
    } finally {
      setSaving(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await userService.deleteAccount();
      // Clears stored token/user and returns to the login screen.
      await logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      Alert.alert(
        t("myAccount.deleteAccountErrorTitle"),
        error?.response?.data?.message ||
          t("myAccount.deleteAccountErrorMessage"),
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("myAccount.deleteAccountTitle"),
      t("myAccount.deleteAccountConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("myAccount.deleteAccountAction"),
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ],
    );
  };

  const handleUploadDocuments = async () => {
    if (!profileId) {
      Alert.alert(
        t("myAccount.uploadErrorTitle"),
        t("myAccount.userIdMissing"),
      );
      return;
    }

    const remainingSlots = 4 - documents.length;

    if (remainingSlots <= 0) {
      Alert.alert(t("myAccount.limitTitle"), t("myAccount.limitMessage"));
      return;
    }

    try {
      const pickedAssets = await pickUploadAssets({
        fileNamePrefix: "account-document",
      });

      if (!pickedAssets.length) {
        return;
      }

      if (pickedAssets.length > remainingSlots) {
        Alert.alert(
          t("myAccount.tooManyTitle"),
          t("myAccount.tooManyMessage", { count: remainingSlots }),
        );
        return;
      }

      const updatedUser = await userService.uploadDocuments(
        profileId,
        pickedAssets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.name || `document-${Date.now()}-${index + 1}`,
          mimeType: asset.mimeType || asset.type || "application/octet-stream",
          type: asset.mimeType || asset.type || "application/octet-stream",
        })),
      );

      setProfile(updatedUser);
      applyProfileToForm(updatedUser);
      await updateStoredUser({
        ...(user || {}),
        ...updatedUser,
        id: updatedUser?._id || updatedUser?.id || profileId,
      });
      showSuccess({
        title: t("myAccount.docsUploaded"),
        message: t("myAccount.docsUploadedMessage"),
      });
    } catch (error) {
      console.error("Failed to upload documents:", error);
      Alert.alert(
        t("myAccount.uploadDocsErrorTitle"),
        error?.response?.data?.message || t("project.openErrorMessage"),
      );
    }
  };

  const handleOpenDocument = async (documentUrl) => {
    const resolvedUrl = resolveImageUrl(documentUrl);
    const documentName = getDocumentNameFromUrl(
      resolvedUrl,
      t("documentPreview.fallbackName"),
    );

    if (!resolvedUrl) {
      Alert.alert(
        t("project.documentUnavailableTitle"),
        t("project.documentUnavailableMessage"),
      );
      return;
    }

    try {
      if (
        isPreviewImageDocument({ url: resolvedUrl, name: documentName }) ||
        isPdfDocument({ url: resolvedUrl, name: documentName })
      ) {
        navigation.navigate("DocumentPreview", {
          document: {
            url: resolvedUrl,
            name: documentName,
          },
        });
        return;
      }

      await Linking.openURL(resolvedUrl);
    } catch (error) {
      console.error("Failed to open document:", error);
      Alert.alert(t("project.openErrorTitle"), t("project.openErrorMessage"));
    }
  };

  const documents = Array.isArray(profile?.additionalDocuments)
    ? profile.additionalDocuments
    : [];

  const avatarSource = resolveImageUrl(profile?.avatarUrl || user?.avatarUrl);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0785F4" />
        <Text style={styles.statusText}>{t("myAccount.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          {t("menu.myAccount")}
        </Text>
        <FloatingActionButton
          onPress={handleSave}
          disabled={saving}
          renderContent={() =>
            saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="check" size={24} color="#FFFFFF" />
            )
          }
        />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={
                avatarSource
                  ? { uri: avatarSource }
                  : require("../../assets/Avatar.png")
              }
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleChangeAvatar}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#0091FF" />
              ) : (
                <Image
                  style={styles.editAvatarIcon}
                  source={require("../../assets/EditAvatar.png")}
                />
              )}
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.roleBadgeLarge,
              { backgroundColor: roleInfo.color + "26" },
            ]}
          >
            <Image style={styles.roleBadgeIcon} source={roleInfo.icon} />
            <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
              {roleInfo.title}
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>{t("auth.yourName")}</Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={t("myAccount.typePlaceholder")}
            value={form.name}
            onChangeText={(value) => handleChange("name", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>{t("myAccount.roleLabel")}</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.readOnlyInput]}
            value={roleInfo.title}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>{t("myAccount.emailLabel")}</Text>
          </View>
          <TextInput
            style={[styles.textInput, styles.readOnlyInput]}
            value={form.email}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>
              {t("myAccount.professionLabel")}
            </Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder={t("myAccount.typePlaceholder")}
            value={form.profession}
            onChangeText={(value) => handleChange("profession", value)}
          />
        </View>

        <View style={styles.rowContainer}>
          <View style={styles.areaCodeContainer}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>{t("myAccount.areaCode")}</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={t("myAccount.typePlaceholder")}
              value={form.phoneAreaCode}
              onChangeText={(value) => handleChange("phoneAreaCode", value)}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.phoneContainer}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>{t("myAccount.phone")}</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder={t("myAccount.typePlaceholder")}
              value={form.phoneNumber}
              onChangeText={(value) => handleChange("phoneNumber", value)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.documentsContainer}>
          <Text style={styles.documentsLabel}>
            {t("myAccount.additionalDocs")}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleUploadDocuments}
          >
            <Image
              style={styles.addIcon}
              source={require("../../assets/PlusBlack.png")}
            />
          </TouchableOpacity>
          {documents.length ? (
            <View style={styles.documentsGrid}>
              {documents.map((document, index) => {
                const typeMeta = getDocumentTypeMeta(document);
                const imageDocument = isImageDocument(document);
                const documentUri = resolveImageUrl(document);

                return (
                  <TouchableOpacity
                    key={`${document}-${index}`}
                    style={styles.documentCard}
                    onPress={() => handleOpenDocument(document)}
                    activeOpacity={0.85}
                  >
                    {imageDocument && documentUri ? (
                      <Image
                        source={{ uri: documentUri }}
                        style={styles.documentImage}
                      />
                    ) : (
                      <View style={styles.documentFileContent}>
                        <Icon name={typeMeta.icon} size={18} color="#052D50" />
                        <Text numberOfLines={2} style={styles.documentName}>
                          {getDocumentName(document, index)}
                        </Text>
                        <Text style={styles.documentTypeBadge}>
                          {typeMeta.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyDocumentsText}>
              {t("myAccount.noDocs")}
            </Text>
          )}
          <Text style={styles.documentsHint}>
            {t("myAccount.docsCount", { count: documents.length })}
          </Text>
        </View>

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.85}
          >
            {deletingAccount ? (
              <ActivityIndicator color="#D64545" />
            ) : (
              <>
                <Icon name="trash-2" size={18} color="#D64545" />
                <Text style={styles.deleteAccountText}>
                  {t("myAccount.deleteAccountAction")}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.deleteAccountHint}>
            {t("myAccount.deleteAccountHint")}
          </Text>
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    gap: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#EEEEEE",
  },
  statusText: {
    marginTop: 12,
    color: "#698196",
  },
  header: {
    ...standardScreenHeader,
  },
  backButton: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 9999,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 12,
  },
  avatarContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 130,
    height: 130,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    backgroundColor: "#ffffff",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarIcon: {
    width: 11,
    height: 11,
  },
  roleBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  roleBadgeIcon: {
    width: 16,
    height: 16,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    width: "100%",
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  inputLabelRow: {
    flexDirection: "row",
  },
  inputLabel: {
    color: "#00000050",
  },
  requiredAsterisk: {
    color: "#ff0000ff",
  },
  textInput: {
    marginTop: 6,
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 4,
  },
  readOnlyInput: {
    color: "#698196",
  },
  rowContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  areaCodeContainer: {
    width: "35%",
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  phoneContainer: {
    flex: 1,
    padding: 12,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  documentsContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    gap: 8,
    position: "relative",
  },
  documentsLabel: {
    color: "#052D5050",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  addIcon: {
    width: 20,
    height: 20,
  },
  documentsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  documentCard: {
    width: "23%",
    height: 84,
    backgroundColor: "#EFEFF0",
    borderRadius: 12,
    overflow: "hidden",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentFileContent: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
  },
  documentName: {
    color: "#052D50",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "500",
  },
  documentTypeBadge: {
    color: "#052D50",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyDocumentsText: {
    color: "#698196",
    marginTop: 4,
  },
  documentsHint: {
    color: "#698196",
    fontSize: 12,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
  },
  dangerZone: {
    marginTop: 28,
    marginBottom: 8,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0C4C4",
    backgroundColor: "#FDECEC",
  },
  deleteAccountText: {
    color: "#D64545",
    fontSize: 15,
    fontFamily: "DMSans-SemiBold",
  },
  deleteAccountHint: {
    color: "#698196",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
