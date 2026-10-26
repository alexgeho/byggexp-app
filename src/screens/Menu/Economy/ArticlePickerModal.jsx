import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { SheetPressable } from "../../../components/common/SheetSlideIn/SheetSlideIn";

// Pick an article from the company catalogue onto an invoice/offer row — the
// same list the web form offers in its row dropdown. Picking fills the row's
// article number, name, price, unit and VAT rate; new articles are created on
// the Articles screen, as on the web. A material order passes `filter` (only
// grossist articles), `fetchArticles(query)` (server search, the worker can't
// read the whole register) and `showPrice={false}` — the worker orders, not
// prices.
export default function ArticlePickerModal({
  visible,
  onClose,
  onSelect,
  filter,
  fetchArticles,
  showPrice = true,
  priceKey = "priceExclMoms",
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Latest search function (it closes over the order's supplier).
  const fetchRef = useRef(fetchArticles);
  fetchRef.current = fetchArticles;

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const data = fetchRef.current
        ? await fetchRef.current(query)
        : await articleService.getAll();
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

  // Server search: ask again as the worker types (results are capped at 50,
  // so filtering only what came back would miss articles).
  useEffect(() => {
    if (!visible || !fetchArticles) return undefined;
    const timer = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const active = articles.filter((article) =>
      filter ? filter(article) : article?.active !== false,
    );
    if (!query) return active;
    return active.filter((article) =>
      [article.articleNumber, article.name, article.nameEnglish]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [articles, search, filter]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <SheetPressable style={styles.modalSheet} onPress={() => {}}>
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
                          showPrice &&
                            formatMoney(
                              article[priceKey] || 0,
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
        </SheetPressable>
      </Pressable>
    </Modal>
  );
}
