import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

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
import { layout } from "../../theme/spacing";
import { getEntityId } from "../../utils/entityId";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { isEgenkontrollOnly } from "../../utils/companyModules";

const NEW_PROJECT = "__new__";
const today = () => new Date().toISOString().slice(0, 10);

// New egenkontroll: upload the contract / arbetsbeskrivning → the AI drafts the
// control points → check them → save. The project can be created right here
// (solo users often have none yet).
export default function NewEgenkontrollScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
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
      if (solo || pid === NEW_PROJECT) {
        const project = await projectService.create({
          name: address.trim() || title.trim() || t("egenkontroll.title"),
          location: address.trim() || undefined,
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
          gap: layout.betweenCards,
          paddingBottom: layout.listBottom,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Button
          title={t("egenkontroll.fromContract")}
          onPress={readContract}
          loading={reading}
        />

        <FieldCard>
          {solo ? (
            <FieldRow
              variant="input"
              label={t("egenkontroll.address")}
              value={address}
              onChangeText={setAddress}
              placeholder={t("egenkontroll.addressPlaceholder")}
            />
          ) : null}
          <FieldRow
            variant="input"
            label={t("egenkontroll.titleLabel")}
            value={title}
            onChangeText={setTitle}
            placeholder={t("egenkontroll.titlePlaceholder")}
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
                  placeholder={t("egenkontroll.point")}
                  isLast={i === items.length - 1}
                />
              ))}
            </FieldCard>
          </>
        ) : null}

        <Button
          variant="secondary"
          title={t("egenkontroll.addPoint")}
          onPress={() =>
            setItems((prev) => [...prev, { text: "", reference: "" }])
          }
        />
      </ScrollView>
    </Screen>
  );
}
