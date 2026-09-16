import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  InputAccessoryView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import { notesService } from "../../../services";
import { getDateLocale } from "../../../utils/dateLocale";
// Reuse the shift-history preview styles for an identical look.
import { createStyles } from "../ShiftHistoryPreview/ShiftHistoryPreview.styles";

// Links the quick-add TextInput to its keyboard accessory bar (iOS).
const ACCESSORY_ID = "notesQuickAddAccessory";

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
// ShiftHistoryPreview / TasksPreview. Most recently edited first. Notes are
// written inline here — the internal list/detail screens are intentionally not
// linked for now (quick-add + read-only recent list only).
export function NotesPreview({ colorMode = "dark", onClose, refreshKey = 0 }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

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

  const canSend = !!draft.trim() && !saving;

  // Thin ring around the send arrow — shared by the iOS keyboard accessory and
  // the Android focused-only fallback.
  const sendButton = (
    <TouchableOpacity
      style={[
        extraStyles.sendBtn,
        { borderColor: canSend ? styles.linkText.color : secondaryIconColor },
      ]}
      onPress={handleSend}
      disabled={!canSend}
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
          color={canSend ? styles.linkText.color : secondaryIconColor}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notes.title")}</Text>
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

        {/* Quick-add — write a note straight from Home. The send control lives
            on the keyboard (iOS InputAccessoryView) so it only shows while
            typing; Android has no accessory view, so it falls back to an inline
            ring shown only while the field is focused. */}
        <View style={extraStyles.inputRow}>
          <TextInput
            style={[extraStyles.input, { color: styles.dateText.color }]}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            // Placeholder clears the moment the field is tapped (focused).
            placeholder={
              focused ? "" : t("notes.quickAdd", "Skriv en anteckning…")
            }
            placeholderTextColor={styles.emptyText.color}
            inputAccessoryViewID={
              Platform.OS === "ios" ? ACCESSORY_ID : undefined
            }
            multiline
          />
          {Platform.OS !== "ios" && focused ? sendButton : null}
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
                <View
                  key={note._id || note.id || index}
                  style={[
                    extraStyles.item,
                    index !== notes.length - 1 && styles.itemDivider,
                  ]}
                >
                  <Text style={styles.dateText}>
                    {formatDate(note.updatedAt || note.createdAt)}
                  </Text>
                  <Text style={styles.projectText} numberOfLines={1}>
                    {title || body || t("notes.untitled")}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={extraStyles.accessoryBar}>{sendButton}</View>
        </InputAccessoryView>
      ) : null}
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
    marginRight: 14,
  },
  // Bar sitting on top of the keyboard (iOS), holding the send ring on the right.
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F2F2F7",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.12)",
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
