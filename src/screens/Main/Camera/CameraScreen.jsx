import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { expenseService, shiftService } from "../../../services";
import ExpenseReviewSheet from "./ExpenseReviewSheet";
import {
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
  standardScreenContainer,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";
import {
  IMAGE_DOCUMENT_TYPES,
  pickUploadAssets,
} from "../../../utils/uploadPicker";

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("shift"); // 'shift' | 'expense'
  const [scanning, setScanning] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const autoLaunchTriggeredRef = useRef(false);
  const cameraLaunchInFlightRef = useRef(false);

  const getPhotoFileName = useCallback(
    (photo) => {
      if (photo?.name) {
        return photo.name;
      }

      const urlSegment = photo?.url?.split("/").pop();
      return urlSegment || t("camera.photoFallback");
    },
    [t],
  );

  const formatPhotoCountLabel = useCallback(
    (count) => {
      return t("camera.photoCount", { count });
    },
    [t],
  );

  const loadShift = useCallback(async () => {
    try {
      setLoading(true);
      const currentShift = await shiftService.getCurrent();

      if (route.params?.shiftId && currentShift?.id !== route.params.shiftId) {
        setShift(null);
        return;
      }

      setShift(currentShift);
    } catch (error) {
      console.error("Failed to load current shift for camera:", error);
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, [route.params?.shiftId]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const uploadAssets = useCallback(
    async (assets) => {
      if (!shift?.id || !assets?.length) {
        return;
      }

      const updatedShift = await shiftService.uploadPhotos(
        shift.id,
        assets.map((asset, index) => ({
          uri: asset.uri,
          name:
            asset.fileName ||
            asset.name ||
            `shift-photo-${Date.now()}-${index + 1}.jpg`,
          mimeType: asset.mimeType || asset.type || "image/jpeg",
          type: asset.mimeType || asset.type || "image/jpeg",
        })),
      );

      setShift(updatedShift);
    },
    [shift?.id],
  );

  // Kvitto mode: scan the captured photo, then open the review sheet.
  const handleExpensePhoto = useCallback(async (rawAsset) => {
    if (!rawAsset?.uri) {
      return;
    }
    const asset = {
      uri: rawAsset.uri,
      name: rawAsset.fileName || rawAsset.name || `kvitto-${Date.now()}.jpg`,
      mimeType: rawAsset.mimeType || rawAsset.type || "image/jpeg",
    };
    setScanning(true);
    let scanned = {};
    try {
      scanned = await expenseService.scan(asset);
    } catch {
      scanned = {}; // fall back to manual entry
    } finally {
      setScanning(false);
    }
    setReviewData({ asset, scanned });
  }, []);

  const handleAttachFile = useCallback(async () => {
    if (mode === "shift" && !shift?.id) {
      Alert.alert(
        t("camera.shiftRequiredTitle"),
        t("camera.shiftRequiredFiles"),
      );
      return;
    }

    try {
      setUploading(true);
      const pickedAssets = await pickUploadAssets({
        documentTypes: IMAGE_DOCUMENT_TYPES,
        fileNamePrefix: mode === "expense" ? "kvitto" : "shift-photo",
      });

      if (!pickedAssets.length) {
        return;
      }

      if (mode === "expense") {
        await handleExpensePhoto(pickedAssets[0]);
        return;
      }

      await uploadAssets(pickedAssets);
      showSuccess({
        title: t("camera.fileAttached"),
        message: t("camera.fileAttachedMessage"),
      });
    } catch (error) {
      console.error("Failed to attach shift file:", error);
      Alert.alert(
        t("camera.attachErrorTitle"),
        error?.response?.data?.message ||
          error?.message ||
          t("camera.attachFileError"),
      );
    } finally {
      setUploading(false);
    }
  }, [mode, shift?.id, uploadAssets, handleExpensePhoto, showSuccess, t]);

  const promptOpenSettings = useCallback(() => {
    Alert.alert(
      t("camera.cameraAccessTitle"),
      t("camera.cameraAccessSettings"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("camera.openSettings"),
          onPress: () => Linking.openSettings(),
        },
      ],
    );
  }, [t]);

  const handleTakePhoto = useCallback(async () => {
    if (cameraLaunchInFlightRef.current || uploading) {
      return;
    }

    if (mode === "shift" && !shift?.id) {
      Alert.alert(
        t("camera.shiftRequiredTitle"),
        t("camera.shiftRequiredPhotos"),
      );
      return;
    }

    try {
      cameraLaunchInFlightRef.current = true;
      setUploading(true);
      let permission = await ImagePicker.getCameraPermissionsAsync();

      if (!permission.granted) {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permission.granted) {
        if (permission.canAskAgain === false) {
          promptOpenSettings();
          return;
        }

        Alert.alert(
          t("camera.cameraAccessTitle"),
          t("camera.cameraAccessAllow"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("camera.attachFile"), onPress: () => handleAttachFile() },
          ],
        );
        return;
      }

      let result;

      try {
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      } catch (cameraError) {
        console.warn(
          "Camera unavailable, falling back to file picker:",
          cameraError,
        );
        Alert.alert(
          t("camera.cameraUnavailableTitle"),
          t("camera.cameraUnavailableMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("camera.attachFile"), onPress: () => handleAttachFile() },
          ],
        );
        return;
      }

      if (result.canceled || !result.assets?.length) {
        return;
      }

      if (mode === "expense") {
        await handleExpensePhoto(result.assets[0]);
        return;
      }

      await uploadAssets(result.assets);
      showSuccess({
        title: t("camera.photoAttached"),
        message: t("camera.photoAttachedMessage"),
      });
    } catch (error) {
      console.error("Failed to capture shift photo:", error);
      Alert.alert(
        t("camera.cameraErrorTitle"),
        error?.response?.data?.message ||
          error?.message ||
          t("camera.attachPhotoError"),
      );
    } finally {
      cameraLaunchInFlightRef.current = false;
      setUploading(false);
    }
  }, [
    mode,
    handleAttachFile,
    handleExpensePhoto,
    promptOpenSettings,
    shift?.id,
    uploadAssets,
    uploading,
  ]);

  useEffect(() => {
    if (
      !route.params?.autoOpen ||
      loading ||
      !shift?.id ||
      autoLaunchTriggeredRef.current
    ) {
      return;
    }

    autoLaunchTriggeredRef.current = true;

    let timeoutId;
    const interactionTask = InteractionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => {
        handleTakePhoto();
      }, 350);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      interactionTask.cancel();
    };
  }, [handleTakePhoto, loading, route.params?.autoOpen, shift?.id]);

  const renderHeader = () => (
    <View style={styles.header}>
      <BackButton
        backgroundColor="rgba(255, 255, 255, 0.6)"
        tint="light"
        borderColor="#FFFFFF50"
        onPress={() => navigation.goBack()}
        iconSource={require("../../../assets/Arrow-left.png")}
      />
      <Text
        style={[
          styles.headerTitle,
          { fontFamily: theme.text.fontFamily.semiBold },
        ]}
      >
        {t("home.buttons.camera")}
      </Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[styles.modeBtn, mode === "shift" && styles.modeBtnActive]}
        onPress={() => setMode("shift")}
      >
        <Text
          style={[
            styles.modeBtnText,
            mode === "shift" && styles.modeBtnTextActive,
          ]}
        >
          {t("camera.modeShift")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeBtn, mode === "expense" && styles.modeBtnActive]}
        onPress={() => setMode("expense")}
      >
        <Text
          style={[
            styles.modeBtnText,
            mode === "expense" && styles.modeBtnTextActive,
          ]}
        >
          {t("camera.modeExpense")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        {renderHeader()}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#0091FF" />
        </View>
      </View>
    );
  }

  if (!shift && mode === "shift") {
    return (
      <View style={styles.centered}>
        {renderHeader()}
        {renderModeToggle()}
        <View style={styles.emptyStateContent}>
          <Text style={styles.emptyTitle}>{t("camera.noActiveShift")}</Text>
          <Text style={styles.emptyText}>{t("camera.noShiftHint")}</Text>
        </View>
        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderModeToggle()}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTakePhoto}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.buttonContent}>
              <Image
                source={require("../../../assets/Camera-white.png")}
                style={styles.buttonIcon}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                {t("camera.takePhoto")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleAttachFile}
          disabled={uploading}
        >
          <View style={styles.buttonContent}>
            <Image
              source={require("../../../assets/Paperclip-blue.png")}
              style={styles.secondaryButtonIcon}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("camera.attachFile")}
            </Text>
          </View>
        </TouchableOpacity>

        {mode === "shift" && shift ? (
          <View style={styles.photosCard}>
            {!shift.photos?.length ? (
              <>
                <Text
                  style={[
                    styles.photosCardTitle,
                    { fontFamily: theme.text.fontFamily.semiBold },
                  ]}
                >
                  {t("camera.photosForShift")}
                </Text>

                <View style={styles.photosEmptyBlock}>
                  <Image
                    source={require("../../../assets/Camera-gray.png")}
                    style={styles.photosEmptyIcon}
                  />
                  <Text
                    style={[
                      styles.photosEmptyTitle,
                      { fontFamily: theme.text.fontFamily.semiBold },
                    ]}
                  >
                    {t("camera.noPhotosYet")}
                  </Text>
                  <Text
                    style={[
                      styles.photosEmptyDescription,
                      { fontFamily: theme.text.fontFamily.regular },
                    ]}
                  >
                    {t("camera.noPhotosHint")}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.photosAttachedBlock}>
                <View style={styles.photosAttachedHeader}>
                  <Text
                    style={[
                      styles.photosAttachedTitle,
                      { fontFamily: theme.text.fontFamily.semiBold },
                    ]}
                  >
                    {t("camera.attachedPhoto")}
                  </Text>
                  <View style={styles.activeShiftBadge}>
                    <Text
                      style={[
                        styles.activeShiftBadgeText,
                        { fontFamily: theme.text.fontFamily.medium },
                      ]}
                    >
                      {formatPhotoCountLabel(shift.photos.length)}
                    </Text>
                  </View>
                </View>

                {shift.photos.map((photo, index) => (
                  <View
                    key={`${photo.url}-${index}`}
                    style={[
                      styles.attachedPhotoItem,
                      index < shift.photos.length - 1 &&
                        styles.attachedPhotoItemSpacing,
                    ]}
                  >
                    <Image
                      source={{ uri: resolveUploadUrl(photo.url) }}
                      style={styles.photo}
                    />
                    <View style={styles.attachedPhotoMeta}>
                      <View style={styles.attachedPhotoMetaText}>
                        <Text
                          style={[
                            styles.attachedPhotoName,
                            { fontFamily: theme.text.fontFamily.semiBold },
                          ]}
                        >
                          {getPhotoFileName(photo)}
                        </Text>
                        <Text
                          style={[
                            styles.attachedPhotoDate,
                            { fontFamily: theme.text.fontFamily.regular },
                          ]}
                        >
                          {t("camera.dateShift", {
                            date: formatShiftDayLabel(shift.shiftDate),
                          })}
                        </Text>
                      </View>
                      <View style={styles.visibleInShiftsBadge}>
                        <Text
                          style={[
                            styles.visibleInShiftsBadgeText,
                            { fontFamily: theme.text.fontFamily.medium },
                          ]}
                        >
                          {t("camera.visibleInShifts")}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!shift.photos?.length ? (
              <>
                <View style={styles.photosDivider} />

                <Text
                  style={[
                    styles.photosFooter,
                    { fontFamily: theme.text.fontFamily.regular },
                  ]}
                >
                  {t("camera.photosFooter")}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />

      {scanning ? (
        <View style={styles.scanOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.scanOverlayText}>
            {t("camera.scanningReceipt")}
          </Text>
        </View>
      ) : null}

      <ExpenseReviewSheet
        visible={!!reviewData}
        asset={reviewData?.asset}
        scanned={reviewData?.scanned}
        shift={shift}
        onClose={() => setReviewData(null)}
        onSaved={() => {
          setReviewData(null);
          showSuccess({
            title: t("camera.expenseSaved"),
            message: t("camera.expenseSavedMessage"),
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    gap: 0,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    gap: 12,
    paddingBottom: 140,
  },
  centered: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerPlaceholder: {
    ...standardScreenHeaderPlaceholder,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  modeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(7, 133, 244, 0.35)",
  },
  modeBtnActive: {
    backgroundColor: "#0785F4",
    borderColor: "#0785F4",
  },
  modeBtnText: {
    color: "#0785F4",
    fontSize: 14,
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#ffffff",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 45, 80, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scanOverlayText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyStateContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 140,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 140,
  },
  projectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  projectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  projectCardLabel: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  activeShiftBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "rgba(58, 129, 219, 0.1)",
    borderRadius: 10,
  },
  activeShiftBadgeText: {
    color: "rgba(58, 129, 219, 1)",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  projectName: {
    marginTop: 10,
    color: "rgba(5, 45, 80, 1)",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: "rgba(7, 133, 244, 1)",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 1,
    borderColor: "rgba(7, 133, 244, 0.72)",
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(4.5px)",
          WebkitBackdropFilter: "blur(4.5px)",
        }
      : {}),
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  secondaryButtonIcon: {
    width: 20,
    height: 20,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "rgba(7, 133, 244, 0.9)",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  cameraHint: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 32,
  },
  photosCard: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: 20,
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(4.5px)",
          WebkitBackdropFilter: "blur(4.5px)",
        }
      : {}),
  },
  photosCardTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginBottom: 14,
  },
  photosEmptyBlock: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  photosEmptyIcon: {
    width: 20,
    height: 20,
    marginBottom: 10,
  },
  photosEmptyTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  photosEmptyDescription: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  photosAttachedBlock: {
    marginBottom: 14,
  },
  photosAttachedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  photosAttachedTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    flex: 1,
  },
  attachedPhotoItem: {
    gap: 12,
  },
  attachedPhotoItemSpacing: {
    marginBottom: 16,
  },
  attachedPhotoMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  attachedPhotoMetaText: {
    flex: 1,
    gap: 2,
  },
  attachedPhotoName: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  attachedPhotoDate: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  visibleInShiftsBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "rgba(58, 129, 219, 0.1)",
    borderRadius: 10,
    flexShrink: 0,
  },
  visibleInShiftsBadgeText: {
    color: "rgba(58, 129, 219, 1)",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  photosDivider: {
    height: 1,
    backgroundColor: "rgba(5, 45, 80, 0.1)",
    marginBottom: 14,
  },
  photosFooter: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
  },
  emptyTitle: {
    color: "#052D50",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#698196",
    textAlign: "center",
  },
});
