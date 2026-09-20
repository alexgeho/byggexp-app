import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { articleService } from "../../../services/article.service";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { getEntityId } from "../../../utils/entityId";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// Artiklar — a list screen like the admin's ArticleListPage: the articles
// themselves, with a "+" that opens the form on its own screen.
export default function ArticlesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await articleService.getAll();
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load articles:", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Swipe an article left to delete it, like every other list in the app.
  const handleDelete = useCallback(
    async (article) => {
      const id = getEntityId(article);
      try {
        await articleService.remove(id);
        setArticles((previous) =>
          previous.filter((item) => getEntityId(item) !== id),
        );
      } catch (error) {
        const status = error?.response?.status;
        const raw = error?.response?.data?.message ?? error?.message;
        const detail = Array.isArray(raw) ? raw.join(", ") : raw;
        console.error("Failed to delete article:", status, detail, error);
        Alert.alert(
          t("common.error"),
          `${t("articleForm.deleteFailed")}\n[${status ?? "?"}] ${detail ?? ""}`,
        );
      }
    },
    [t],
  );

  const renderDeleteAction = useCallback(
    (article) => (
      <TouchableOpacity
        style={styles.swipeDeleteAction}
        activeOpacity={0.85}
        onPress={() => handleDelete(article)}
        accessibilityRole="button"
        accessibilityLabel={t("common.delete")}
      >
        <Icon name="trash-2" size={22} color="#FFFFFF" />
        <Text style={styles.swipeDeleteText}>{t("common.delete")}</Text>
      </TouchableOpacity>
    ),
    [handleDelete, styles, t],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>{t("articleForm.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            data={articles}
            keyExtractor={(article, index) =>
              getEntityId(article) || `article-${index}`
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {t("articleForm.emptyList")}
                </Text>
              </View>
            }
            renderItem={({ item: article }) => (
              <Swipeable
                renderRightActions={() => renderDeleteAction(article)}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
              >
                <ListCard title={article.name || t("common.noName")}>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {[
                      article.articleNumber,
                      article.unit || "st",
                      `${article.momsPercent ?? 25}%`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </ListCard>
              </Swipeable>
            )}
          />
        )}

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={true}
          onAddPress={() => navigation.navigate("CreateArticle")}
        />
      </View>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: {
      width: 44,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      paddingBottom: 140,
    },
    swipeDeleteAction: {
      backgroundColor: "#FF3B30",
      width: 92,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      marginBottom: 12,
    },
    swipeDeleteText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    cardMeta: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    emptyState: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: "center",
    },
  });
