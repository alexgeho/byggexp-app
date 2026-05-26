import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Image,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";

import { projectService } from "../../../services";
import { API_BASE_URL } from "../../../services/api";
import { sortByNewest } from "../../../utils/sortByNewest";

import { createStyles } from "./ProjectFilesSection.style";

export default function ProjectFilesSection({
  project,
  colorMode = "dark",
  onClose,
  refreshKey = 0,
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const styles = createStyles(theme, colorMode);

  const [currentPage, setCurrentPage] = useState(0);
  const [projectData, setProjectData] = useState(project || null);
  const projectId = project?._id || project?.id || projectData?._id || projectData?.id;
  const files = projectData?.documents || [];

  useEffect(() => {
    setProjectData(project || null);
  }, [project]);

  const refreshProjectFiles = useCallback(async () => {
    if (!projectId) {
      setProjectData(project || null);
      return;
    }

    try {
      const populatedProject = await projectService.getPopulatedById(projectId);
      setProjectData(populatedProject || project || null);
    } catch (error) {
      console.error("Failed to refresh project files preview:", error);
      setProjectData(project || null);
    }
  }, [project, projectId]);

  useEffect(() => {
    void refreshProjectFiles();
  }, [refreshKey, refreshProjectFiles]);

  const normalizedFiles = useMemo(
    () =>
      sortByNewest(
        files.map(function normalizeFile(file, index) {
          const fileUrl =
            typeof file === "string"
              ? file
              : file?.url;

          const fileName =
            typeof file === "string"
              ? `Document ${index + 1}`
              : file?.name || `Document ${index + 1}`;

          const mimeType =
            typeof file === "string"
              ? ""
              : file?.mimeType || "";

          const isImage =
            mimeType.startsWith("image/") ||
            /\.(png|jpe?g|gif|webp|bmp|heic|heif|svg)$/i.test(
              fileName,
            );

          return {
            id:
              typeof file === "string"
                ? `${file}-${index}`
                : file?._id || file?.url || `${index}`,
            name: fileName,
            url: /^https?:\/\//i.test(fileUrl)
              ? fileUrl
              : `${API_BASE_URL}${fileUrl?.startsWith("/") ? fileUrl : `/${fileUrl}`}`,
            uploadedAt:
              typeof file === "string" ? null : file?.uploadedAt || null,
            createdAt:
              typeof file === "string" ? null : file?.createdAt || null,
            isImage,
          };
        }),
        (file) => [file?.uploadedAt, file?.createdAt],
      ),
    [files],
  );

  const pages = useMemo(() => {
    const nextPages = [];

    for (let index = 0; index < normalizedFiles.length; index += 3) {
      nextPages.push(
        normalizedFiles.slice(index, index + 3),
      );
    }

    return nextPages;
  }, [normalizedFiles]);

  useEffect(() => {
    setCurrentPage(0);
  }, [projectId, normalizedFiles.length]);

  if (!normalizedFiles.length) {
    return null;
  }

  const visibleFiles = pages[currentPage] || [];
  const canGoBack = currentPage > 0;
  const canGoForward =
    currentPage < pages.length - 1;
  const showCarouselControls =
    normalizedFiles.length > 3;
  const usePeekLayout =
    visibleFiles.length === 3;
  const visibleSlotIndexes = visibleFiles.map(
    function mapFile(_file, index) {
      return index;
    },
  );

  function handleViewAll() {
    if (!projectId) {
      return;
    }

    navigation.navigate("Project", {
      id: projectId,
      initialTab: "Documents",
    });
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Project Documents
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleViewAll}
            activeOpacity={0.8}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              View all
            </Text>
            <Icon
              name="arrow-right"
              size={18}
              color="rgba(255,255,255,0.72)"
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselViewport}>
        {onClose ? (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeButton}
          >
            <Icon name="x" size={18} color="rgba(255,255,255,0.72)" />
          </TouchableOpacity>
        ) : null}

        <View
          style={
            usePeekLayout
              ? styles.peekTrack
              : [
                  styles.carouselRow,
                  styles.carouselRowRegular,
                ]
          }
        >
          {visibleSlotIndexes.map(function renderSlot(slotIndex) {
            const file = visibleFiles[slotIndex];
            const isFirstVisible =
              slotIndex === 0;
            const isLastVisible =
              slotIndex ===
              visibleFiles.length - 1;

            return (
              <View
                key={slotIndex}
                style={[
                  styles.carouselSlot,
                  usePeekLayout
                    ? [
                        styles.carouselSlotPeek,
                        slotIndex === 0 &&
                          styles.peekLeftSlot,
                        slotIndex === 1 &&
                          styles.peekCenterSlot,
                        slotIndex === 2 &&
                          styles.peekRightSlot,
                      ]
                    : styles.carouselSlotRegular,
                ]}
              >
                {file ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleViewAll}
                    style={styles.fileTouchable}
                  >
                    {file.isImage ? (
                      <View
                        style={[
                          styles.imageFrame,
                          isFirstVisible &&
                            styles.imageFirst,
                          isLastVisible &&
                            styles.imageLast,
                        ]}
                      >
                        <Image
                          source={{
                            uri: file.url,
                          }}
                          style={styles.image}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.fileFallback,
                          isFirstVisible &&
                            styles.imageFirst,
                          isLastVisible &&
                            styles.imageLast,
                        ]}
                      >
                        <Icon
                          name="file-text"
                          size={24}
                          color="#052D50"
                        />
                        <Text
                          style={styles.fileFallbackText}
                          numberOfLines={2}
                        >
                          {file.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        {showCarouselControls && (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                canGoBack &&
                setCurrentPage((previousPage) =>
                  Math.max(0, previousPage - 1),
                )
              }
              disabled={!canGoBack}
              style={[
                styles.navButton,
                styles.navButtonLeft,
                !canGoBack &&
                  styles.navButtonDisabled,
              ]}
            >
              <Icon
                name="chevron-left"
                size={18}
                color="#052D50"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                canGoForward &&
                setCurrentPage((previousPage) =>
                  Math.min(
                    pages.length - 1,
                    previousPage + 1,
                  ),
                )
              }
              disabled={!canGoForward}
              style={[
                styles.navButton,
                styles.navButtonRight,
                !canGoForward &&
                  styles.navButtonDisabled,
              ]}
            >
              <Icon
                name="chevron-right"
                size={18}
                color="#052D50"
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}