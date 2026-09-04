import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { articleService } from "../../../services/article.service";
import { companyService } from "../../../services/company.service";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { getApiErrorMessage } from "../../../utils/apiError";

// Articles — mirrors the admin ArticleCreateForm exactly (name, auto art.no.,
// notes, VAT %, unit; kontering derived). Country drives the VAT options.
const UNIT_OPTIONS = ["st", "h", "dag", "mån", "kg", "m", "m2"];
const VAT_BY_COUNTRY = { SE: [25, 12, 6, 0], NO: [25, 15, 12, 0] };
const buildKontering = (vat) => `Tjänster ${vat}%`;

export default function ArticlesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const [articles, setArticles] = useState([]);
  const [country, setCountry] = useState("SE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    articleNumber: "",
    notes: "",
    momsPercent: 25,
    unit: "st",
  });

  const vatOptions = VAT_BY_COUNTRY[country] || VAT_BY_COUNTRY.SE;

  const loadNextNumber = async () => {
    try {
      const next = await articleService.getNextNumber();
      setForm((prev) => ({
        ...prev,
        articleNumber: typeof next === "string" ? next : next?.number || "",
      }));
    } catch {
      /* auto number is best-effort */
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [list, company] = await Promise.all([
          articleService.getAll().catch(() => []),
          companyService.getMyCompany().catch(() => null),
        ]);
        if (!active) return;
        setArticles(Array.isArray(list) ? list : []);
        if (company?.country) setCountry(company.country);
      } finally {
        if (active) setLoading(false);
      }
    })();
    loadNextNumber();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (saving) return;
    if (!form.name.trim()) {
      showError({ message: t("articleForm.nameRequired") });
      return;
    }
    setSaving(true);
    try {
      const created = await articleService.create({
        companyId: user?.companyId,
        name: form.name.trim(),
        articleNumber: form.articleNumber || undefined,
        notes: form.notes.trim() || undefined,
        momsPercent: form.momsPercent,
        unit: form.unit,
        kontering: buildKontering(form.momsPercent),
      });
      setArticles((prev) => [created, ...prev]);
      setForm({
        name: "",
        articleNumber: "",
        notes: "",
        momsPercent: 25,
        unit: "st",
      });
      loadNextNumber();
      showSuccess({ title: t("articleForm.savedTitle") });
    } catch (error) {
      showError({
        message: getApiErrorMessage(error, t("common.error", "Fel")),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>
          {t("articleForm.title", "Artiklar")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>
            {t("articleForm.new", "Ny artikel")}
          </Text>

          <Field label={t("articleForm.name", "Artikelnamn")} styles={styles}>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => handleChange("name", v)}
              placeholder={t("articleForm.name", "Artikelnamn")}
              placeholderTextColor={theme.content.placeholder}
            />
          </Field>

          <Field
            label={t("articleForm.articleNumber", "Art.nr")}
            styles={styles}
          >
            <TextInput
              style={[styles.input, styles.readOnly]}
              value={String(form.articleNumber || "")}
              editable={false}
            />
          </Field>

          <Field label={t("articleForm.vat", "Moms %")} styles={styles}>
            <View style={styles.chips}>
              {vatOptions.map((v) => (
                <Chip
                  key={v}
                  label={`${v}%`}
                  active={form.momsPercent === v}
                  onPress={() => handleChange("momsPercent", v)}
                  styles={styles}
                  accent={theme.colors.primary}
                />
              ))}
            </View>
          </Field>

          <Field label={t("articleForm.unit", "Enhet")} styles={styles}>
            <View style={styles.chips}>
              {UNIT_OPTIONS.map((u) => (
                <Chip
                  key={u}
                  label={u}
                  active={form.unit === u}
                  onPress={() => handleChange("unit", u)}
                  styles={styles}
                  accent={theme.colors.primary}
                />
              ))}
            </View>
          </Field>

          <Field label={t("articleForm.notes", "Anteckningar")} styles={styles}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.notes}
              onChangeText={(v) => handleChange("notes", v)}
              placeholder={t("articleForm.notes", "Anteckningar")}
              placeholderTextColor={theme.content.placeholder}
              multiline
            />
          </Field>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {t("articleForm.add", "Lägg till artikel")}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t("articleForm.existing", "Dina artiklar")}
          </Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : articles.length === 0 ? (
            <Text style={styles.empty}>
              {t("articleForm.emptyList", "Inga artiklar än.")}
            </Text>
          ) : (
            articles.map((a, i) => (
              <View key={a._id || a.id || i} style={styles.listRow}>
                <Text style={styles.listName} numberOfLines={1}>
                  {a.name}
                </Text>
                <Text style={styles.listMeta}>
                  {a.unit || "st"} · {a.momsPercent ?? 25}%
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, styles, children }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress, styles, accent }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: accent, borderColor: accent },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && { color: "#FFFFFF" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 18,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    fieldBlock: { gap: 8 },
    label: {
      color: c.textPrimary,
      fontSize: 13,
      fontFamily: theme.text.fontFamily.medium,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 15,
    },
    readOnly: { opacity: 0.6 },
    textarea: { minHeight: 80, textAlignVertical: "top" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipText: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: theme.text.fontFamily.medium,
    },
    saveBtn: {
      marginTop: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: "center",
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
    empty: { color: c.textMuted, fontSize: 14 },
    listRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      gap: 12,
    },
    listName: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: theme.text.fontFamily.medium,
    },
    listMeta: { color: c.textMuted, fontSize: 13 },
  });
}
