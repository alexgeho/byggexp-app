import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import Icon from "react-native-vector-icons/Feather";
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";

// The project detail tabs. Data-driven so the six near-identical TouchableOpacity
// blocks become one map; the Economy tab is finance-gated. Behaviour and order
// are unchanged from the inline version.
const PROJECT_TABS = [
  { key: "Tasks", labelKey: "project.tabs.tasks" },
  { key: "Documents", labelKey: "project.tabs.documents" },
  { key: "Workers", labelKey: "project.tabs.workers" },
  { key: "Tools", labelKey: "project.tabs.tools" },
  { key: "Photos", labelKey: "project.tabs.photos" },
  { key: "Economy", labelKey: "project.tabs.economy", financeOnly: true },
];

export function ProjectTabBar({
  active,
  onSelect,
  canSeeFinance,
  styles,
  activeColor,
  t,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContainer}
    >
      {PROJECT_TABS.filter((tab) => !tab.financeOnly || canSeeFinance).map(
        (tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={[
                styles.tabButton,
                isActive && styles.activeTab,
                isActive && { borderColor: activeColor },
              ]}
            >
              <Text
                style={[styles.tabText, isActive && { color: activeColor }]}
              >
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        },
      )}
    </ScrollView>
  );
}

// Photos tab: date-grouped grid of shift photos + receipts; tapping a photo
// opens the preview. Data (grouped sections + loading) is owned by the screen.
export function ProjectPhotosTab({
  loading,
  photoSections,
  onPreview,
  styles,
  primaryColor,
  t,
}) {
  if (loading) {
    return (
      <View style={styles.tabLoading}>
        <ActivityIndicator color={primaryColor} />
      </View>
    );
  }

  if (!photoSections || !photoSections.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>{t("project.noPhotosTitle")}</Text>
        <Text style={styles.emptyStateText}>{t("project.noPhotosText")}</Text>
      </View>
    );
  }

  return photoSections.map((section) => (
    <View key={section.date} style={styles.photoSection}>
      <View style={styles.photoSectionHeader}>
        <Text style={styles.photoSectionDate}>
          {formatShiftDayLabel(section.date)}
        </Text>
        <Text style={styles.photoSectionCount}>
          {t("camera.photoCount", { count: section.count })}
        </Text>
      </View>
      <View style={styles.photoGrid}>
        {section.photos.map((photo, index) => (
          <TouchableOpacity
            key={`${photo.url}-${index}`}
            activeOpacity={0.85}
            onPress={() => onPreview(resolveUploadUrl(photo.url))}
          >
            <ExpoImage
              source={resolveUploadUrl(photo.url)}
              style={styles.photoThumb}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
            {photo.isReceipt ? (
              <View style={styles.receiptTag}>
                <Icon name="file-text" size={12} color="#FFFFFF" />
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ));
}

// Workers tab: the project's team as tappable person rows.
export function ProjectWorkersTab({
  workers,
  projectId,
  onOpenWorker,
  styles,
  t,
}) {
  if (!workers.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {t("project.noWorkersTitle")}
        </Text>
        <Text style={styles.emptyStateText}>{t("project.noWorkersText")}</Text>
      </View>
    );
  }

  return workers.map((worker) => (
    <PersonListItem
      key={worker._id || worker.id}
      person={worker}
      subtitle={
        worker.profession || worker.email || t("employees.noProfession")
      }
      statusBadge={getWorkerStatusBadge(worker, projectId, t)}
      onPress={() => onOpenWorker(worker._id || worker.id)}
    />
  ));
}
