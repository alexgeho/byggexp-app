import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import AuthContext from "../../contexts/AuthContext";
import { projectService, userService } from "../../services";
import { API_BASE_URL } from "../../services/api";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";
import {
  getDocumentNameFromUrl,
  isImageDocument,
  isPdfDocument,
} from "../../utils/documentPreview";
import { sortByNewest } from "../../utils/sortByNewest";

const resolveDocumentUrl = (url) => {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const getEntityId = (value) => value?._id || value?.id || null;

const getDocumentName = (document, index) => {
  if (typeof document === "string") {
    return getDocumentNameFromUrl(document, `Document ${index + 1}`);
  }

  return (
    document?.name ||
    getDocumentNameFromUrl(document?.url, `Document ${index + 1}`)
  );
};

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const normalizeDocuments = ({
  documents,
  sectionKey,
  parentName,
  secondaryLabel,
  fallbackTimestamp,
  parentId,
}) => {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents
    .map((document, index) => {
      const rawUrl =
        typeof document === "string" ? document : document?.url;
      const url = resolveDocumentUrl(rawUrl);

      if (!url) {
        return null;
      }

      const name = getDocumentName(document, index);
      const mimeType =
        typeof document === "string" ? "" : document?.mimeType || "";
      const uploadedAt =
        typeof document === "string"
          ? fallbackTimestamp || null
          : document?.uploadedAt || document?.createdAt || fallbackTimestamp || null;
      const createdAt =
        typeof document === "string" ? null : document?.createdAt || null;

      return {
        id:
          typeof document === "string"
            ? `${sectionKey}-${parentId || parentName || "root"}-${index}`
            : document?._id || document?.url || `${sectionKey}-${index}`,
        sectionKey,
        name,
        url,
        mimeType,
        uploadedAt,
        createdAt,
        parentName,
        secondaryLabel,
        extension: name.includes(".") ? name.split(".").pop().toUpperCase() : "FILE",
        isImage: isImageDocument({ name, mimeType, url }),
      };
    })
    .filter(Boolean);
};

const getDocumentIcon = (document) => {
  if (document?.isImage) {
    return "image";
  }

  if (isPdfDocument(document)) {
    return "file-text";
  }

  return "file";
};

function DocumentsSection({ title, documents, onOpenDocument, theme }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {title}
        </Text>
        <View style={styles.sectionCountBadge}>
          <Text
            style={[
              styles.sectionCountText,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {documents.length}
          </Text>
        </View>
      </View>

      <View style={styles.groupCard}>
        {documents.length ? (
          documents.map((document, index) => {
            const uploadedLabel = formatDate(
              document.uploadedAt || document.createdAt,
            );

            return (
              <TouchableOpacity
                key={document.id}
                activeOpacity={0.85}
                onPress={() => onOpenDocument(document)}
                style={[
                  styles.documentRow,
                  index !== documents.length - 1 && styles.documentRowDivider,
                ]}
              >
                <View style={styles.documentIconWrap}>
                  <Icon
                    name={getDocumentIcon(document)}
                    size={18}
                    color="#052D50"
                  />
                </View>

                <View style={styles.documentContent}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.documentName,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {document.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.documentMeta,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {document.parentName}
                    {document.secondaryLabel
                      ? ` • ${document.secondaryLabel}`
                      : ""}
                  </Text>
                  {uploadedLabel ? (
                    <Text
                      style={[
                        styles.documentSubMeta,
                        { fontFamily: theme.text.fontFamily.medium },
                      ]}
                    >
                      {t("documents.uploaded", { date: uploadedLabel })}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.documentRight}>
                  <View style={styles.extensionBadge}>
                    <Text
                      style={[
                        styles.extensionText,
                        { fontFamily: theme.text.fontFamily.semiBold },
                      ]}
                    >
                      {document.extension}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#698196" />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptySection}>
            <Text
              style={[
                styles.emptySectionText,
                { fontFamily: theme.text.fontFamily.medium },
              ]}
            >
              {t("documents.emptyCategory")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, userId, logout, isLoading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);

  const loadDocuments = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      const [profileData, baseProjects] = await Promise.all([
        userService.getInfo(userId),
        user?.role === "superadmin"
          ? projectService.getAll()
          : projectService.getMyProjects(),
      ]);

      // Backend already scopes projects by role.
      const populatedProjects = await Promise.all(
        (Array.isArray(baseProjects) ? baseProjects : []).map((project) =>
          projectService.getPopulatedById(getEntityId(project)),
        ),
      );

      setProfile(profileData);
      setProjects(populatedProjects);
    } catch (error) {
      console.error("Failed to load documents:", error);
      Alert.alert(
        t("documents.loadErrorTitle"),
        t("documents.loadErrorMessage"),
      );
      setProfile(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role, userId, t]);

  useEffect(() => {
    if (!authLoading && userId) {
      loadDocuments();
    }
  }, [authLoading, loadDocuments, userId]);

  const sections = useMemo(() => {
    const projectDocuments = sortByNewest(
      projects.flatMap((project) =>
        normalizeDocuments({
          documents: project?.documents,
          sectionKey: "projects",
          parentName: project?.name || t("project.fallbackName"),
          secondaryLabel: project?.location || null,
          fallbackTimestamp: project?.createdAt || null,
          parentId: getEntityId(project),
        }),
      ),
      (document) => [document?.uploadedAt, document?.createdAt],
    );

    const taskDocuments = sortByNewest(
      projects.flatMap((project) =>
        (Array.isArray(project?.tasks) ? project.tasks : [])
          .filter((task) => task && typeof task === "object")
          .flatMap((task) =>
            normalizeDocuments({
              documents: task?.documents,
              sectionKey: "tasks",
              parentName: task?.taskTitle || t("task.fallbackTitle"),
              secondaryLabel: project?.name || null,
              fallbackTimestamp:
                task?.updatedAt || task?.createdAt || project?.createdAt || null,
              parentId: getEntityId(task),
            }),
          ),
      ),
      (document) => [document?.uploadedAt, document?.createdAt],
    );

    const personalDocuments = sortByNewest(
      normalizeDocuments({
        documents: profile?.additionalDocuments,
        sectionKey: "personal",
        parentName: user?.name || t("menu.myAccount"),
        secondaryLabel: t("documents.personalDoc"),
        fallbackTimestamp: profile?.updatedAt || profile?.createdAt || null,
        parentId: userId,
      }),
      (document) => [document?.uploadedAt, document?.createdAt],
    );

    return [
      {
        key: "projects",
        title: t("menu.projects"),
        documents: projectDocuments,
      },
      {
        key: "tasks",
        title: t("menu.tasks"),
        documents: taskDocuments,
      },
      {
        key: "personal",
        title: t("documents.personalTitle"),
        documents: personalDocuments,
      },
    ];
  }, [profile?.additionalDocuments, profile?.createdAt, profile?.updatedAt, projects, user?.name, userId, t]);

  const totalDocuments = sections.reduce(
    (count, section) => count + section.documents.length,
    0,
  );

  const handleOpenDocument = useCallback(
    async (document) => {
      if (!document?.url) {
        Alert.alert(
          t("project.documentUnavailableTitle"),
          t("project.documentUnavailableMessage"),
        );
        return;
      }

      try {
        if (document.isImage || isPdfDocument(document)) {
          navigation.navigate("DocumentPreview", { document });
          return;
        }

        await Linking.openURL(document.url);
      } catch (error) {
        console.error("Failed to open document:", error);
        Alert.alert(t("project.openErrorTitle"), t("project.openErrorMessage"));
      }
    },
    [navigation, t],
  );

  if (loading && !totalDocuments) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            styles.statusText,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {t("documents.loading")}
        </Text>
      </View>
    );
  }

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
          {t("project.tabs.documents")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadDocuments}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIconWrap,
              { backgroundColor: `${theme.colors.primary}1A` },
            ]}
          >
            <Icon name="folder" size={28} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("documents.heroTitle")}
          </Text>
          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("documents.heroText")}
          </Text>

          <View style={styles.summaryRow}>
            {sections.map((section) => (
              <View key={section.key} style={styles.summaryCard}>
                <Text
                  style={[
                    styles.summaryValue,
                    { fontFamily: theme.text.fontFamily.semiBold },
                  ]}
                >
                  {section.documents.length}
                </Text>
                <Text
                  style={[
                    styles.summaryLabel,
                    { fontFamily: theme.text.fontFamily.medium },
                  ]}
                >
                  {section.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {sections.map((section) => (
          <DocumentsSection
            key={section.key}
            title={section.title}
            documents={section.documents}
            onOpenDocument={handleOpenDocument}
            theme={theme}
          />
        ))}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onActionPress={logout}
        renderActionContent={() => (
          <Text
            style={[
              styles.logoutButtonText,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("menu.logOut")}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  centeredContainer: {
    ...standardScreenContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    marginTop: 12,
    fontSize: 15,
    color: "#4D6376",
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
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    color: "#052D50",
    fontSize: 20,
    marginBottom: 8,
  },
  heroText: {
    color: "#4D6376",
    fontSize: 15,
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  summaryValue: {
    color: "#052D50",
    fontSize: 20,
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#698196",
    fontSize: 12,
    textAlign: "center",
  },
  sectionWrap: {
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "#052D50",
    fontSize: 17,
  },
  sectionCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(5, 45, 80, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  sectionCountText: {
    color: "#052D50",
    fontSize: 13,
  },
  groupCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  documentRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  documentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(5, 45, 80, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  documentContent: {
    flex: 1,
    gap: 2,
  },
  documentName: {
    color: "#052D50",
    fontSize: 15,
  },
  documentMeta: {
    color: "#4D6376",
    fontSize: 13,
  },
  documentSubMeta: {
    color: "#698196",
    fontSize: 12,
  },
  documentRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  extensionBadge: {
    minWidth: 44,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(5, 45, 80, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  extensionText: {
    color: "#052D50",
    fontSize: 10,
  },
  emptySection: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptySectionText: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
});
