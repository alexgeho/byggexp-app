import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { articleService } from "../../../services/article.service";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { getEntityId } from "../../../utils/entityId";

export default function ArticlesScreen() {
  const { t } = useTranslation();
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

  return (
    <EntityListScreen
      title={t("articleForm.title")}
      data={articles}
      loading={loading}
      keyExtractor={(article, index) =>
        getEntityId(article) || `article-${index}`
      }
      onDelete={handleDelete}
      emptyText={t("articleForm.emptyList")}
      addScreen="CreateArticle"
      renderCard={(article) => (
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
      )}
    />
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    cardMeta: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
  });
