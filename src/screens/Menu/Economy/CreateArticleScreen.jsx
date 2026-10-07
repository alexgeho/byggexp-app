import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { articleService } from "../../../services/article.service";
import { companyService } from "../../../services/company.service";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  ChoiceChips,
  FormFooter,
  FormHeader,
} from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";

// New article — mirrors the admin ArticleCreateForm exactly (name, auto art.no.,
// notes, VAT %, unit; kontering derived). Country drives the VAT options.
const VAT_BY_COUNTRY = { SE: [25, 12, 6, 0], NO: [25, 15, 12, 0] };
const buildKontering = (vat) => `Tjänster ${vat}%`;

export default function CreateArticleScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useFeedback();

  const [country, setCountry] = useState("SE");
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
        const company = await companyService.getMyCompany().catch(() => null);
        if (!active) return;
        if (company?.country) setCountry(company.country);
      } catch {
        /* the VAT country default is best-effort */
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
      await articleService.create({
        companyId: user?.companyId,
        name: form.name.trim(),
        articleNumber: form.articleNumber || undefined,
        notes: form.notes.trim() || undefined,
        momsPercent: form.momsPercent,
        unit: form.unit,
        kontering: buildKontering(form.momsPercent),
      });
      showSuccess({ title: t("articleForm.savedTitle") });
      // Back to the list, which refetches on focus.
      navigation.goBack();
    } catch (error) {
      showError({
        message: getApiErrorMessage(error, t("common.error", "Fel")),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FormHeader
        title={t("articleForm.addTitle", "Ny artikel")}
        onBack={() => navigation.goBack()}
        onSave={handleSave}
        saving={saving}
        saveLabel={t("common.save", "Spara")}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <FieldCard>
            <FieldRow
              variant="input"
              floating
              label={t("articleForm.name", "Artikelnamn")}
              value={form.name}
              onChangeText={(v) => handleChange("name", v)}
            />
            <FieldRow
              floating
              label={t("articleForm.articleNumber", "Art.nr")}
              value={String(form.articleNumber || "")}
            />
            <FieldRow label={t("articleForm.vat", "Moms %")} isLast>
              <ChoiceChips
                values={vatOptions}
                value={form.momsPercent}
                onChange={(v) => handleChange("momsPercent", v)}
                format={(v) => `${v}%`}
              />
            </FieldRow>
          </FieldCard>

          <FieldCard>
            <FieldRow
              variant="input"
              multiline
              label={t("articleForm.notes", "Anteckningar")}
              value={form.notes}
              onChangeText={(v) => handleChange("notes", v)}
              isLast
            />
          </FieldCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <FormFooter>
        <Button
          title={t("articleForm.add", "Lägg till artikel")}
          onPress={handleSave}
          loading={saving}
        />
      </FormFooter>
    </SafeAreaView>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
      gap: layout.betweenCards * 2,
    },
  });
}
