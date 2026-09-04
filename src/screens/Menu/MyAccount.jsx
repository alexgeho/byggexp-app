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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Updates from "expo-updates";
import Icon from "react-native-vector-icons/Feather";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { Screen } from "../../components/common/Screen/Screen";
import FloatingActionButton from "../../components/common/FloatingActionButton/FloatingActionButton";
import { createStyles } from "./MyAccount.styles";
import {
  getDocumentNameFromUrl,
  isImageDocument as isPreviewImageDocument,
  isPdfDocument,
} from "../../utils/documentPreview";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { userService } from "../../services";
import { resolveUploadUrl } from "../../utils/shifts";

const parseOptionalNumber = (value) => {
  const normalized = String(value || "").replace(/\D/g, "");
  return normalized ? parseInt(normalized, 10) : undefined;
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
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
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
  // Workers don't see their own role label ("Arbetare") — the rank can feel
  // demeaning and adds nothing for them. Admins still see roles.
  const isWorker = activeRole === "worker";

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
        : "+46",
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
      // Confirm to the user before we sign them out — once logout() runs the
      // screen unmounts and returns to the login flow, so we tie the sign-out
      // to the alert's OK button to guarantee the message is seen.
      Alert.alert(
        t("myAccount.deleteAccountSuccessTitle"),
        t("myAccount.deleteAccountSuccessMessage"),
        [{ text: t("common.ok"), onPress: () => logout() }],
      );
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
    const resolvedUrl = resolveUploadUrl(documentUrl);
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

  const avatarSource = resolveUploadUrl(profile?.avatarUrl || user?.avatarUrl);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0785F4" />
        <Text style={styles.statusText}>{t("myAccount.loading")}</Text>
      </View>
    );
  }

  return (
    <Screen
      title={t("menu.myAccount")}
      onBack={() => navigation.goBack()}
      right={
        <FloatingActionButton
          accessibilityLabel={t("common.save")}
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
      }
    >
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
          {!isWorker && (
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
          )}
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

        {!isWorker && (
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
        )}

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
                const documentUri = resolveUploadUrl(document);

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

        <Text style={styles.buildInfoText}>
          {`Update: ${Updates.updateId || "embedded"}`}
        </Text>
        <Text style={styles.buildInfoText}>
          {`Runtime ${Updates.runtimeVersion || "?"} · ${
            Updates.channel || "—"
          }`}
        </Text>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </Screen>
  );
};
