import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import { notesService } from "../../../services";
import { getDateLocale } from "../../../utils/dateLocale";
// Reuse the shift-history preview styles for an identical look.
import { createStyles } from "../ShiftHistoryPreview/ShiftHistoryPreview.styles";

const formatDate = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

// Home-screen preview of the user's personal notes, mirroring
// ShiftHistoryPreview / TasksPreview. Most recently edited first.
export function NotesPreview({ colorMode = "dark", onClose, refreshKey = 0 }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesService.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load notes preview:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const openNote = (note) =>
    navigation.navigate("CreateNote", { noteId: note._id || note.id });

  // Quick-add straight from the Home card — no internal screen needed.
  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || saving) {
      return;
    }
    try {
      setSaving(true);
      await notesService.create({ body });
      setDraft("");
      await load();
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setSaving(false);
    }
  }, [draft, saving, load]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notes.title")}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Notes")}
            activeOpacity={0.8}
          >
            <Text style={styles.linkText}>{t("common.viewAll")}</Text>
            <Icon
              name="arrow-right"
              size={18}
              color={secondaryIconColor}
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, extraStyles.card]}>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Icon name="x" size={18} color={secondaryIconColor} />
          </TouchableOpacity>
        ) : null}

        {/* Quick-add — write a note straight from Home, no internal screen. The
            send control mirrors the close (×) style and sits just under it, level
            with the first line of text. */}
        <View style={extraStyles.inputRow}>
          <TextInput
            style={[extraStyles.input, { color: styles.dateText.color }]}
            value={draft}
            onChangeText={setDraft}
            placeholder={t("notes.quickAdd", "Skriv en anteckning…")}
            placeholderTextColor={styles.emptyText.color}
            multiline
          />
          <TouchableOpacity
            style={[
              extraStyles.sendBtn,
              {
                borderColor: draft.trim()
                  ? styles.linkText.color
                  : secondaryIconColor,
              },
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || saving}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={t("notes.add", "Lägg till anteckning")}
          >
            {saving ? (
              <ActivityIndicator size="small" color={secondaryIconColor} />
            ) : (
              <Icon
                name="arrow-up"
                size={16}
                color={
                  draft.trim() ? styles.linkText.color : secondaryIconColor
                }
              />
            )}
          </TouchableOpacity>
        </View>

        {loading ? null : notes.length ? (
          <ScrollView
            style={[styles.scrollArea, extraStyles.listBelow]}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {notes.map((note, index) => {
              const title = (note.title || "").trim();
              const body = (note.body || "").trim();
              return (
                <TouchableOpacity
                  key={note._id || note.id || index}
                  style={[
                    extraStyles.item,
                    index !== notes.length - 1 && styles.itemDivider,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openNote(note)}
                >
                  <Text style={styles.dateText}>
                    {formatDate(note.updatedAt || note.createdAt)}
                  </Text>
                  <Text style={styles.projectText} numberOfLines={1}>
                    {title || body || t("notes.untitled")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const extraStyles = StyleSheet.create({
  // Let the card grow with the input + a few notes instead of a fixed height.
  card: {
    height: undefined,
    minHeight: 92,
  },
  inputRow: {
    flexDirection: "row",
    // Vertically centred: text and the send control sit in the middle of the
    // cell. The × stays pinned to the corner above, so the send (a bit inset
    // from the right via marginRight) never merges with it.
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    marginTop: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans-Regular",
    maxHeight: 88,
    paddingTop: 0,
    paddingBottom: 0,
  },
  // Thin ring around the arrow — same stroke weight as the arrow/× icons.
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  listBelow: {
    marginTop: 12,
    maxHeight: 132,
  },
  item: {
    gap: 4,
  },
});

export default NotesPreview;
