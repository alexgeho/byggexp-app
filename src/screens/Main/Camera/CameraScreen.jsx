import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal/ImagePreviewModal";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { expenseService, shiftService } from "../../../services";
import ExpenseReviewSheet from "./ExpenseReviewSheet";
import { useTheme } from "../../../theme/ThemeContext";
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";
import { getDateLocale } from "../../../utils/dateLocale";
import { formatMoney } from "../../../utils/billingTotals";
import {
  IMAGE_DOCUMENT_TYPES,
  pickUploadAssets,
} from "../../../utils/uploadPicker";
import { createStyles } from "./CameraScreen.styles";

const CAMERA_TABS = [
  { key: "shift", labelKey: "camera.modeShift" },
  { key: "expense", labelKey: "camera.modeExpense" },
];

// Build date-grouped photo sections (newest first) from shift history days.
const buildPhotoSections = (days) =>
  (days || [])
    .map((day) => {
      const photos = (day.shifts || []).flatMap((shift) =>
        (shift.photos || []).map((photo) => ({ ...photo })),
      );
      return {
        date: day.date,
        label: formatShiftDayLabel(day.date),
        count: photos.length,
        photos,
      };
    })
    .filter((section) => section.count > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

// Group saved receipts (utlägg) into date sections, newest first — mirrors
// buildPhotoSections so the "Receipts" tab reads like the shift-photo gallery.
const buildReceiptSections = (expenses) => {
  const groups = new Map();
  (expenses || []).forEach((expense) => {
    const stamp = expense?.createdAt || expense?.date || "";
    const dayKey = String(stamp).slice(0, 10);
    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }
    groups.get(dayKey).push(expense);
  });
  return Array.from(groups.entries())
    .map(([date, receipts]) => ({
      date,
      label: date ? formatShiftDayLabel(date) : "",
      count: receipts.length,
      receipts,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

export default function CameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { showSuccess } = useFeedback();
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || user?._id || null;
  const [shift, setShift] = useState(null);
  const [photoSections, setPhotoSections] = useState([]);
  const [receiptSections, setReceiptSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("shift"); // 'shift' | 'expense'
  const [scanning, setScanning] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(null);
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
    (count) => t("camera.photoCount", { count }),
    [t],
  );

  const refreshSections = useCallback(async () => {
    try {
      // The camera gallery shows only the current user's own shift photos,
      // never the whole project/company (admins would otherwise see everyone).
      const history = await shiftService.getHistory(
        currentUserId ? { workerId: currentUserId } : {},
      );
      setPhotoSections(buildPhotoSections(history?.days || []));
    } catch (error) {
      console.error("Failed to load shift photos history:", error);
    }
  }, [currentUserId]);

  const refreshReceipts = useCallback(async () => {
    try {
      // Same scope as the photo gallery: only the current user's own receipts.
      // (Admins get the whole company from the API, so we filter client-side.)
      const list = await expenseService.list();
      const own = (Array.isArray(list) ? list : []).filter(
        (expense) =>
          !currentUserId || String(expense?.userId) === String(currentUserId),
      );
      setReceiptSections(buildReceiptSections(own));
    } catch (error) {
      console.error("Failed to load receipts:", error);
    }
  }, [currentUserId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentShift] = await Promise.all([
        shiftService.getCurrent().catch(() => null),
        refreshSections(),
        refreshReceipts(),
      ]);

      if (route.params?.shiftId && currentShift?.id !== route.params.shiftId) {
        setShift(null);
      } else {
        setShift(currentShift);
      }
    } catch (error) {
      console.error("Failed to load camera data:", error);
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, [refreshSections, refreshReceipts, route.params?.shiftId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      await refreshSections();
    },
    [shift?.id, refreshSections],
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

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery("");
      }
      return !open;
    });
  }, []);

  const visibleSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return photoSections;
    }
    return photoSections
      .map((section) => {
        if (section.label.toLowerCase().includes(query)) {
          return section;
        }
        const photos = section.photos.filter((photo) =>
          getPhotoFileName(photo).toLowerCase().includes(query),
        );
        return photos.length
          ? { ...section, photos, count: photos.length }
          : null;
      })
      .filter(Boolean);
  }, [photoSections, searchQuery, getPhotoFileName]);

  const getReceiptTitle = useCallback(
    (receipt) =>
      receipt?.supplierName?.trim() ||
      receipt?.category?.trim() ||
      t("camera.expense.title"),
    [t],
  );

  const visibleReceiptSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return receiptSections;
    }
    return receiptSections
      .map((section) => {
        if (section.label.toLowerCase().includes(query)) {
          return section;
        }
        const receipts = section.receipts.filter((receipt) =>
          getReceiptTitle(receipt).toLowerCase().includes(query),
        );
        return receipts.length
          ? { ...section, receipts, count: receipts.length }
          : null;
      })
      .filter(Boolean);
  }, [receiptSections, searchQuery, getReceiptTitle]);

  const renderHeader = () => (
    <View style={styles.header}>
      <BackButton
        backgroundColor={theme.content.surfaceMuted}
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
      <TouchableOpacity
        style={styles.searchButton}
        onPress={toggleSearch}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t("a11y.search")}
      >
        <Icon
          name={searchOpen ? "x" : "search"}
          size={20}
          color={theme.content.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      {CAMERA_TABS.map((tab) => {
        const active = mode === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => setMode(tab.key)}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabText,
                {
                  fontFamily:
                    theme.text.fontFamily[active ? "semiBold" : "medium"],
                },
                active && styles.tabTextActive,
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderEmpty = (title, hint) => (
    <View style={styles.emptyBlock}>
      <Image
        source={require("../../../assets/Camera-gray.png")}
        style={styles.emptyIcon}
      />
      <Text
        style={[
          styles.emptyBlockTitle,
          { fontFamily: theme.text.fontFamily.semiBold },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.emptyBlockText,
          { fontFamily: theme.text.fontFamily.regular },
        ]}
      >
        {hint}
      </Text>
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

  return (
    <View style={styles.container}>
      {renderHeader()}

      {searchOpen ? (
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#698196" />
          <TextInput
            style={[
              styles.searchInput,
              { fontFamily: theme.text.fontFamily.regular },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("camera.searchPlaceholder")}
            placeholderTextColor="#9BB0C1"
            autoFocus
            returnKeyType="search"
          />
        </View>
      ) : null}

      {renderTabs()}

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mode === "shift"
          ? visibleSections.length
            ? visibleSections.map((section) => (
                <View key={section.date} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionDate,
                        { fontFamily: theme.text.fontFamily.medium },
                      ]}
                    >
                      {section.label}
                    </Text>
                    <Text
                      style={[
                        styles.sectionCount,
                        { fontFamily: theme.text.fontFamily.regular },
                      ]}
                    >
                      {formatPhotoCountLabel(section.count)}
                    </Text>
                  </View>

                  <View style={styles.grid}>
                    {section.photos.map((photo, index) => (
                      <TouchableOpacity
                        key={`${photo.url}-${index}`}
                        activeOpacity={0.85}
                        onPress={() =>
                          setPreviewPhoto(resolveUploadUrl(photo.url))
                        }
                      >
                        <Image
                          source={{ uri: resolveUploadUrl(photo.url) }}
                          style={styles.thumb}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            : renderEmpty(
                searchQuery ? t("camera.noResults") : t("camera.noPhotosYet"),
                searchQuery
                  ? t("camera.noResultsHint")
                  : t("camera.noPhotosHint"),
              )
          : visibleReceiptSections.length
            ? visibleReceiptSections.map((section) => (
                <View key={section.date} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionDate,
                        { fontFamily: theme.text.fontFamily.medium },
                      ]}
                    >
                      {section.label}
                    </Text>
                    <Text
                      style={[
                        styles.sectionCount,
                        { fontFamily: theme.text.fontFamily.regular },
                      ]}
                    >
                      {formatPhotoCountLabel(section.count)}
                    </Text>
                  </View>

                  <View style={styles.grid}>
                    {section.receipts.map((receipt, index) => {
                      const receiptUri = receipt.receiptUrl
                        ? resolveUploadUrl(receipt.receiptUrl)
                        : null;
                      return (
                        <TouchableOpacity
                          key={`${receipt._id || receipt.id || index}`}
                          activeOpacity={0.85}
                          disabled={!receiptUri}
                          onPress={() =>
                            receiptUri && setPreviewPhoto(receiptUri)
                          }
                        >
                          <View style={styles.thumb}>
                            {receiptUri ? (
                              <Image
                                source={{ uri: receiptUri }}
                                style={styles.thumbImage}
                              />
                            ) : (
                              <Image
                                source={require("../../../assets/Camera-gray.png")}
                                style={styles.receiptPlaceholderIcon}
                              />
                            )}
                            {receipt.amount ? (
                              <View style={styles.receiptAmount}>
                                <Text
                                  style={styles.receiptAmountText}
                                  numberOfLines={1}
                                >
                                  {formatMoney(receipt.amount, getDateLocale())}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            : renderEmpty(
                searchQuery
                  ? t("camera.noResults")
                  : t("camera.receiptsEmptyTitle"),
                searchQuery
                  ? t("camera.noResultsHint")
                  : t("camera.receiptsEmptyHint"),
              )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton
        onAddPress={handleTakePhoto}
        addDisabled={uploading}
        addAccessibilityLabel={t("a11y.camera")}
        renderAddContent={() =>
          uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Icon name="camera" size={33} color="#FFFFFF" />
          )
        }
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
          refreshReceipts();
          showSuccess({
            title: t("camera.expenseSaved"),
            message: t("camera.expenseSavedMessage"),
          });
        }}
      />

      <ImagePreviewModal
        uri={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </View>
  );
}
