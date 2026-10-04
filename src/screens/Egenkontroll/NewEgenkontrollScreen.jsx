import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { checklistService, projectService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { getEntityId } from "../../utils/entityId";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { createStyles } from "./Egenkontroll.styles";

const NEW_PROJECT = "__new__";
const today = () => new Date().toISOString().slice(0, 10);

// New egenkontroll: upload the contract / arbetsbeskrivning → the AI drafts the
// control points → check them → save. The project can be created right here
// (solo users often have none yet).
export default function NewEgenkontrollScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.content;
  const styles = useMemo(() => createStyles(c), [c]);

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(NEW_PROJECT);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectService
      .getMyProjects({ sort: "newest" })
      .then((list) => {
        // Most recent few only — a long project list would bury the form.
        const arr = (Array.isArray(list) ? list : []).slice(0, 6);
        setProjects(arr);
        if (arr.length) setProjectId(getEntityId(arr[0]));
      })
      .catch(() => setProjects([]));
  }, []);

  const readContract = async () => {
    const [file] = await pickUploadAssets({
      allowsMultipleSelection: false,
      documentTypes: ["application/pdf", "image/*", "text/*"],
      fileNamePrefix: "avtal",
    });
    if (!file) return;
    setReading(true);
    try {
      const data = await checklistService.draftFromDocument(file);
      setDraft(data);
      setTitle((prev) => prev || data.title || "");
      setItems(data.items || []);
    } catch (error) {
      console.error("Draft from document failed:", error);
      Alert.alert(t("common.error"), t("egenkontroll.readFailed"));
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    const points = items.filter((it) => it.text?.trim());
    setSaving(true);
    try {
      let pid = projectId;
      if (pid === NEW_PROJECT) {
        const project = await projectService.create({
          name: title.trim() || t("egenkontroll.title"),
        });
        pid = getEntityId(project);
      }
      const created = await checklistService.create({
        projectId: pid,
        title: title.trim() || undefined,
        date: today(),
        items: points.map((it) => ({
          text: it.text.trim(),
          reference: it.reference || "",
        })),
        ...(draft
          ? {
              category: draft.category,
              sourceDocument: draft.sourceDocument || undefined,
            }
          : {}),
      });
      navigation.replace("Egenkontroll", { id: getEntityId(created) });
    } catch (error) {
      console.error("Create egenkontroll failed:", error);
      Alert.alert(t("common.error"), t("egenkontroll.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !saving &&
    !reading &&
    (items.some((it) => it.text?.trim()) || title.trim());

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
            {t("egenkontroll.new")}
          </Text>
          <TouchableOpacity
            onPress={save}
            disabled={!canSave}
            style={{ minWidth: 64, alignItems: "flex-end" }}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.link,
                  { fontSize: 16, opacity: canSave ? 1 : 0.4 },
                ]}
              >
                {t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={readContract}
            disabled={reading}
          >
            {reading ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <Icon name="file-text" size={18} color={c.onAccent} />
            )}
            <Text style={styles.primaryButtonText}>
              {reading
                ? t("egenkontroll.reading")
                : t("egenkontroll.fromContract")}
            </Text>
          </TouchableOpacity>
          {!draft && !reading ? (
            <Text style={styles.muted}>
              {t("egenkontroll.fromContractHint")}
            </Text>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.meta}>{t("egenkontroll.project")}</Text>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {[
                { id: NEW_PROJECT, name: t("egenkontroll.newProject") },
                ...projects.map((p) => ({ id: getEntityId(p), name: p.name })),
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, projectId === p.id && styles.chipOk]}
                  onPress={() => setProjectId(p.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      projectId === p.id && styles.chipOkText,
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.meta, { marginTop: 8 }]}>
              {t("egenkontroll.titleLabel")}
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t("egenkontroll.titlePlaceholder")}
              placeholderTextColor={c.placeholder}
            />
          </View>

          {items.length ? (
            <Text style={[styles.meta, { marginTop: 4 }]}>
              {t("egenkontroll.points")}
            </Text>
          ) : null}
          {items.map((it, i) => (
            <View
              key={i}
              style={[styles.card, styles.row, { alignItems: "flex-start" }]}
            >
              <Text style={styles.meta}>{i + 1}.</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <TextInput
                  style={[styles.body, { padding: 0 }]}
                  value={it.text}
                  multiline
                  onChangeText={(text) =>
                    setItems((prev) =>
                      prev.map((p, k) => (k === i ? { ...p, text } : p)),
                    )
                  }
                />
                {it.reference ? (
                  <Text style={styles.meta}>{it.reference}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() =>
                  setItems((prev) => prev.filter((_, k) => k !== i))
                }
                accessibilityLabel={t("common.delete")}
              >
                <Icon name="x" size={18} color={c.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              setItems((prev) => [...prev, { text: "", reference: "" }])
            }
          >
            <Icon name="plus" size={16} color={c.accent} />
            <Text style={styles.secondaryButtonText}>
              {t("egenkontroll.addPoint")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
