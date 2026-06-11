import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { toolService } from "../../services";
import { API_BASE_URL } from "../../services/api";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";

const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

const resolvePhotoUrl = (value) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const canManageTools = (role) =>
  ["superadmin", "companyAdmin", "projectAdmin"].includes(role);

export default function ToolsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);

  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await toolService.getAll();
      setTools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tools:", error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredTools = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return tools;
    }

    return tools.filter((tool) => {
      const searchableText = [tool?.name, tool?.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, tools]);

  useFocusEffect(
    useCallback(() => {
      loadTools();
    }, [loadTools]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            Instruments
          </Text>
          <View style={standardScreenHeaderPlaceholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.searchIconWrapper} pointerEvents="none">
              <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredTools.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No instruments found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.trim()
                    ? "Try a different search query."
                    : canManageTools(user?.role)
                      ? "Tap the add button below to create the first instrument."
                      : "No instruments are assigned yet."}
                </Text>
              </View>
            ) : (
              filteredTools.map((tool) => {
                const toolId = getEntityId(tool);
                const photoUrl = resolvePhotoUrl(tool.photoUrl);

                return (
                  <View key={toolId} style={styles.toolCard}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.toolPhoto} />
                    ) : (
                      <View style={styles.toolPhotoPlaceholder}>
                        <Icon name="tool" size={20} color="rgba(5, 45, 80, 0.35)" />
                      </View>
                    )}
                    <View style={styles.toolInfo}>
                      <Text
                        style={[
                          styles.toolName,
                          { fontFamily: theme.text.fontFamily.semiBold },
                        ]}
                      >
                        {tool.name}
                      </Text>
                      {tool.notes ? (
                        <Text style={styles.toolNotes} numberOfLines={2}>
                          {tool.notes}
                        </Text>
                      ) : null}
                      <Text style={styles.toolMeta}>
                        {tool.workerIds?.length || 0} workers ·{" "}
                        {tool.projectIds?.length || 0} projects
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={canManageTools(user?.role)}
          onAddPress={() => navigation.navigate("CreateTool")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
    paddingBottom: 0,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    flex: 1,
  },
  searchContainer: {
    width: "100%",
    marginBottom: 12,
  },
  searchInputWrapper: {
    position: "relative",
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    minHeight: 48,
    paddingHorizontal: 16,
    paddingRight: 44,
    fontSize: 16,
    color: "#052D50",
  },
  searchIconWrapper: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    paddingBottom: 140,
    gap: 12,
  },
  toolCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  toolPhoto: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  toolPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(5, 45, 80, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolInfo: {
    flex: 1,
    gap: 4,
  },
  toolName: {
    color: "#052D50",
    fontSize: 16,
  },
  toolNotes: {
    color: "rgba(5, 45, 80, 0.65)",
    fontSize: 13,
  },
  toolMeta: {
    color: "rgba(5, 45, 80, 0.45)",
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#052D50",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(5, 45, 80, 0.55)",
    textAlign: "center",
  },
});
