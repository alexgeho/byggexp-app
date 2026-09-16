import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../theme/ThemeContext";
import { notesService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { createStyles } from "./CreateNoteScreen.styles";

export default function CreateNoteScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const noteId = route.params?.noteId || null;
  const isEditing = Boolean(noteId);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load the existing note when editing.
  useEffect(() => {
    let active = true;
    if (!noteId) {
      return undefined;
    }
    (async () => {
      try {
        const note = await notesService.getById(noteId);
        if (active && note) {
          setTitle(note.title || "");
          setBody(note.body || "");
        }
      } catch (err) {
        console.error("Failed to load note:", err);
        if (active) {
          setError(t("notes.loadError", "Kunde inte ladda anteckningen."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [noteId, t]);

  const canSave = (title.trim() || body.trim()) && !saving;

  const handleSave = async () => {
    if (!canSave) {
      // Nothing to save — just leave.
      navigation.goBack();
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = { title: title.trim(), body: body.trim() };
      if (isEditing) {
        await notesService.update(noteId, payload);
      } else {
        await notesService.create(payload);
      }
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save note:", err);
      setError(t("notes.saveError", "Kunde inte spara anteckningen."));
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("notes.deleteTitle", "Ta bort anteckning?"), undefined, [
      { text: t("common.cancel", "Avbryt"), style: "cancel" },
      {
        text: t("common.delete", "Ta bort"),
        style: "destructive",
        onPress: async () => {
          try {
            await notesService.remove(noteId);
            navigation.goBack();
          } catch (err) {
            console.error("Failed to delete note:", err);
            setError(
              t("notes.deleteError", "Kunde inte ta bort anteckningen."),
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.pageContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
            {isEditing
              ? t("notes.editTitle", "Anteckning")
              : t("notes.newTitle", "Ny anteckning")}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {t("common.save", "Spara")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={t("notes.titlePlaceholder", "Titel")}
              placeholderTextColor={theme.content.textMuted}
              returnKeyType="next"
            />

            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder={t("notes.bodyPlaceholder", "Skriv en anteckning…")}
              placeholderTextColor={theme.content.textMuted}
              multiline
            />

            {isEditing ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Icon name="trash-2" size={18} color="#FF3B30" />
                <Text style={styles.deleteText}>
                  {t("notes.delete", "Ta bort anteckning")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
