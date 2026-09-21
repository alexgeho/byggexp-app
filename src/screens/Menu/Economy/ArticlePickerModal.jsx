import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";

// Straight from the module: the services barrel doesn't re-export this one,
// so importing it from there handed back `undefined` and every load threw —
// the sheet said "no articles" however many the company had.
import { articleService } from "../../../services/article.service";
import { formatMoney } from "../../../utils/billingTotals";
import { getDateLocale } from "../../../utils/dateLocale";
import { createStyles, PRIMARY, mutedInk } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";

// Pick an article from the company catalogue onto an invoice/offer row — the
// same list the web form offers in its row dropdown. Picking fills the row's
// article number, name, price, unit and VAT rate; new articles are created on
// the Articles screen, as on the web.
export default function ArticlePickerModal({ visible, onClose, onSelect }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load articles:", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch("");
      load();
    }
  }, [visible, load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const active = articles.filter((article) => article?.active !== false);
    if (!query) return active;
    return active.filter((article) =>
      [article.articleNumber, article.name, article.nameEnglish]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [articles, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.grab} />
          <Text style={styles.modalTitle}>{t("billing.selectArticle")}</Text>

          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={mutedInk(theme.content)} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t("billing.searchArticle")}
              placeholderTextColor={mutedInk(theme.content)}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text style={[styles.clientMeta, { paddingVertical: 16 }]}>
                  {t("billing.noArticles")}
                </Text>
              ) : (
                filtered.map((article, index) => (
                  <TouchableOpacity
                    key={article._id || article.id || article.articleNumber}
                    style={[
                      styles.clientRow,
                      index === filtered.length - 1 && styles.clientRowLast,
                      { flexDirection: "row", alignItems: "center" },
                    ]}
                    onPress={() => onSelect(article)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName} numberOfLines={1}>
                        {article.name || article.articleNumber || "—"}
                      </Text>
                      <Text style={styles.clientMeta} numberOfLines={1}>
                        {[
                          article.articleNumber,
                          formatMoney(
                            article.priceExclMoms || 0,
                            getDateLocale(),
                          ),
                          article.unit,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={mutedInk(theme.content)}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
