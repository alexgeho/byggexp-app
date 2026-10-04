import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useFeedback } from "../../contexts/FeedbackContext";
import { checklistService, projectService } from "../../services";
import { useCardStyles } from "../../styles/cards";
import { Screen } from "../../components/common/Screen/Screen";
import { FieldCard, FieldRow } from "../../components/common/FieldRow/FieldRow";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { ProjectListCard } from "../../components/common/ProjectListCard/ProjectListCard";
import {
  Button,
  HeaderCheckButton,
  SectionTitle,
} from "../../components/common/ui";
import { layout, space } from "../../theme/spacing";
import { getEntityId } from "../../utils/entityId";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { isEgenkontrollOnly } from "../../utils/companyModules";

const NEW_PROJECT = "__new__";
const today = () => new Date().toISOString().slice(0, 10);
// Postel: any spacing / stray commas in a typed address is fine.
const cleanAddress = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "");

// New egenkontroll: upload the contract / arbetsbeskrivning → the AI drafts the
// control points → check them → save. The project can be created right here
// (solo users often have none yet).
export default function NewEgenkontrollScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const cardStyles = useCardStyles();
  const { theme } = useTheme();
  const c = theme.content;
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(NEW_PROJECT);
  const [title, setTitle] = useState("");
  // Solo Egenkontroll plan: no projects — just the site address; a project is
  // created behind the scenes.
  const solo = isEgenkontrollOnly();
  const [address, setAddress] = useState("");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectService
      .getMyProjects({ sort: "newest" })
      .then((list) => {
        // Most recent few only — a long project list would bury the form.
        const arr = (Array.isArray(list) ? list : []).slice(0, 3);
        setProjects(arr);
        if (arr.length) setProjectId(getEntityId(arr[0]));
      })
      .catch(() => setProjects([]));
  }, []);

  const readContract = async () => {
    const [file] = await pickUploadAssets({
      allowsMultipleSelection: false,
      documentTypes: [
        "application/pdf",
        "image/*",
        "image/heic",
        "image/heif",
        "text/*",
      ],
      fileNamePrefix: "avtal",
    });
    if (!file) return;
    setReading(true);
    try {
      const data = await checklistService.draftFromDocument(file);
      setDraft(data);
      setTitle((prev) => prev || data.title || "");
      setItems(data.items || []);
      // Peak: the AI did the work — say so.
      if (data.items?.length) {
        showSuccess({
          title: t("egenkontroll.draftReady", { count: data.items.length }),
          message: data.title || t("egenkontroll.points"),
        });
      }
    } catch (error) {
      console.error("Draft from document failed:", error);
      Alert.alert(t("common.error"), t("egenkontroll.readFailed"));
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    if (!canSave) return;
    const points = items.filter((it) => it.text?.trim());
    const site = cleanAddress(address);
    setSaving(true);
    try {
      let pid = projectId;
      if (solo || pid === NEW_PROJECT) {
        const project = await projectService.create({
          name: site || title.trim() || t("egenkontroll.title"),
          location: site || undefined,
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
          method: it.method || "",
          unit: it.unit || "",
        })),
        ...(draft
          ? {
              category: draft.category,
              trade: draft.trade || "",
              tradeInfo: draft.tradeInfo || null,
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
    (items.some((it) => it.text?.trim()) ||
      title.trim() ||
      (solo && address.trim()));

  const setPoint = (i, text) =>
    setItems((prev) => prev.map((p, k) => (k === i ? { ...p, text } : p)));

  return (
    <Screen
      title={t("egenkontroll.new")}
      onBack={() => navigation.goBack()}
      right={
        <HeaderCheckButton
          onPress={save}
          loading={saving}
          disabled={!canSave}
          accessibilityLabel={t("common.save")}
        />
      }
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // One rhythm: the same 24pt between every block as above the first.
          gap: space.xxl,
          paddingBottom: layout.listBottom,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Upload zone — the app's dashed "add" pattern (see
            ShiftHistoryPreview addSquare), sized as the main entry point. */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={readContract}
          disabled={reading}
          style={[
            styles.dropZone,
            {
              borderColor: `${theme.colors.primary}66`,
              backgroundColor: `${theme.colors.primary}0F`,
            },
          ]}
        >
          <View
            style={[styles.dropIcon, { backgroundColor: theme.colors.primary }]}
          >
            {reading ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <Icon name="file-text" size={26} color={c.onAccent} />
            )}
          </View>
          <Text style={[styles.dropTitle, { color: theme.colors.primary }]}>
            {t("egenkontroll.onboardingContract")}
          </Text>
          <Text style={cardStyles.cardSecondaryText}>PDF · foto</Text>
        </TouchableOpacity>
        {/* Doherty: AI reading takes a while — say what is happening. */}
        {reading ? (
          <Text style={[cardStyles.cardSecondaryText, { textAlign: "center" }]}>
            {t("egenkontroll.reading")}
          </Text>
        ) : null}

        <FieldCard>
          {solo ? (
            <FieldRow
              variant="input"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
              placeholder={t("egenkontroll.address")}
            />
          ) : null}
          <FieldRow
            variant="input"
            value={title}
            onChangeText={setTitle}
            placeholder={t("egenkontroll.titleLabel")}
            isLast
          />
        </FieldCard>

        {solo ? null : (
          <View style={{ gap: layout.betweenCards }}>
            <SectionTitle style={{ marginBottom: 0 }}>
              {t("egenkontroll.project")}
            </SectionTitle>
            <ListCard
              title={t("egenkontroll.newProject")}
              selected={projectId === NEW_PROJECT}
              onPress={() => setProjectId(NEW_PROJECT)}
            />
            {projects.map((p) => (
              <ProjectListCard
                key={getEntityId(p)}
                project={p}
                selected={projectId === getEntityId(p)}
                onPress={() => setProjectId(getEntityId(p))}
              />
            ))}
          </View>
        )}

        {items.length ? (
          <>
            <SectionTitle style={{ marginBottom: 0 }}>
              {t("egenkontroll.points")}
            </SectionTitle>
            {/* An emptied point is dropped on save. */}
            <FieldCard>
              {items.map((it, i) => (
                <FieldRow
                  key={i}
                  variant="input"
                  label={`${i + 1}`}
                  value={it.text}
                  onChangeText={(text) => setPoint(i, text)}
                  isLast={i === items.length - 1}
                />
              ))}
            </FieldCard>
          </>
        ) : null}

        <Button
          variant="primary"
          icon="plus"
          title={t("egenkontroll.addPoint")}
          onPress={() =>
            // Ignored while the AI reads (its points replace the list).
            reading ||
            setItems((prev) => [...prev, { text: "", reference: "" }])
          }
        />
      </ScrollView>
    </Screen>
  );
}

// Layout glue for the upload zone; colours come from the theme.
const styles = StyleSheet.create({
  dropZone: {
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.xxl,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xs,
  },
  dropTitle: { fontSize: 17, fontWeight: "600" },
});
