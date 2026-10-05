import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useFeedback } from "../../contexts/FeedbackContext";
import { checklistService, projectService } from "../../services";
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
import UploadZone from "./UploadZone";

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
  // Doherty: reading takes a while — staged text, then "Skapar kontrollpunkter…".
  const [stage, setStage] = useState(0);
  const [readError, setReadError] = useState(false);
  const abortRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Leaving the screen cancels a running read.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Opened from the empty home upload zone → the picker is already up.
  const { params } = useRoute();
  useEffect(() => {
    if (params?.autoPick) {
      // One-shot: clear it so a later visit doesn't reopen the picker.
      navigation.setParams({ autoPick: undefined });
      readContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const controller = new AbortController();
    abortRef.current = controller;
    setReadError(false);
    setStage(0);
    setReading(true);
    const timer = setTimeout(() => setStage(1), 6000);
    try {
      const data = await checklistService.draftFromDocument(
        file,
        controller.signal,
      );
      if (controller.signal.aborted) return;
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
      if (controller.signal.aborted) return;
      console.error("Draft from document failed:", error);
      setReadError(true);
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) {
        abortRef.current = null;
        setReading(false);
      }
    }
  };

  // "Avbryt": drop the request; its result (if any) is ignored.
  const cancelReading = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setReading(false);
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

  // Something to save = at least one point (and the address in solo).
  const canSave =
    !saving &&
    !reading &&
    items.some((it) => it.text?.trim()) &&
    (!solo || !!address.trim());

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
        <UploadZone
          status={reading ? "reading" : readError ? "error" : "idle"}
          stage={t(
            stage
              ? "egenkontroll.creatingPoints"
              : "egenkontroll.readingContract",
          )}
          onPress={readContract}
          onCancel={cancelReading}
        />

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

        {reading ? (
          <>
            <SectionTitle style={{ marginBottom: 0 }}>
              {t("egenkontroll.points")}
            </SectionTitle>
            <PointsSkeleton />
          </>
        ) : items.length ? (
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

        {/* Points can always be added by hand (with or without a contract). */}
        {!reading ? (
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
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// Six grey placeholder rows while the AI drafts the points.
function PointsSkeleton() {
  const { theme } = useTheme();
  const c = theme.content;
  return (
    <FieldCard>
      {[78, 62, 86, 54, 70, 64].map((w, i) => (
        <View
          key={i}
          style={[
            styles.skeletonRow,
            i < 5 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: c.divider,
            },
          ]}
        >
          <View
            style={[
              styles.skeletonBar,
              { width: `${w}%`, backgroundColor: c.inputSurface },
            ]}
          />
        </View>
      ))}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  // Same height as a point input row (FieldRow tapRow).
  skeletonRow: {
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  skeletonBar: { height: 14, borderRadius: 7 },
});
