import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
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

// The quick-add field puts its send ring on the keyboard (InputAccessoryView).
// The inline-edit field instead shows the ring right inside the note row —
// iOS is unreliable moving a keyboard accessory to a second input, so editing a
// note kept losing the button.
const ACCESSORY_NEW = "notesQuickAddAccessory";

const noteText = (note) => (note?.body || note?.title || "").trim();

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

// Home-screen preview of the user's personal notes. Everything happens inline —
// write a new note at the top, tap any recent note to edit it in place. No
// internal list/detail screens.
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
  // Inline edit: id of the note currently being edited + its working text.
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");

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

  // Quick-add straight from the Home card.
  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || saving) {
      return;
    }
    try {
      setSaving(true);
      await notesService.create({ body });
      setDraft("");
      // Sending closes the field: drop focus + keyboard so the "Skriv en
      // anteckning…" placeholder comes back. (onBlur isn't guaranteed to fire on
      // Keyboard.dismiss(), so reset focused explicitly.) Tap the card again to
      // start another note.
      setFocused(false);
      Keyboard.dismiss();
      await load();
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setSaving(false);
    }
  }, [draft, saving, load]);

  const startEdit = (note) => {
    setEditingId(note._id || note.id);
    setEditDraft(noteText(note));
  };

  // Delete a note. Confirmed first so a stray tap can't wipe it.
  const handleDelete = useCallback(
    async (id) => {
      if (id == null || saving) {
        return;
      }
      try {
        setSaving(true);
        await notesService.remove(id);
        if (editingId === id) {
          setEditingId(null);
          setEditDraft("");
        }
        await load();
      } catch (error) {
        console.error("Failed to delete note:", error);
      } finally {
        setSaving(false);
      }
    },
    [editingId, saving, load],
  );

  const confirmDelete = useCallback(
    (note) => {
      const id = note._id || note.id;
      Alert.alert(t("notes.deleteTitle", "Ta bort anteckning?"), undefined, [
        { text: t("common.cancel", "Avbryt"), style: "cancel" },
        {
          text: t("notes.delete", "Ta bort anteckning"),
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ]);
    },
    [t, handleDelete],
  );

  // Save the inline edit — called on blur and from the keyboard send button.
  // No-ops if unchanged/empty so tapping away without edits just closes it.
  const saveEdit = useCallback(async () => {
    if (editingId == null || saving) {
      return;
    }
    // Confirming/closing the editor drops focus + keyboard (no lingering cursor).
    Keyboard.dismiss();
    const body = editDraft.trim();
    const original = noteText(notes.find((n) => (n._id || n.id) === editingId));
    if (!body || body === original) {
      setEditingId(null);
      setEditDraft("");
      return;
    }
    try {
      setSaving(true);
      await notesService.update(editingId, { body });
      setEditingId(null);
      setEditDraft("");
      await load();
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setSaving(false);
    }
  }, [editingId, editDraft, notes, saving, load]);

  // Ring colours: white on the coloured "glass" home, the theme link colour on a
  // light home. Used by both the keyboard accessory and the inline edit ring.
  const onLightSurface = colorMode === "light";
  const ringAccent = onLightSurface ? styles.linkText.color : "#FFFFFF";
  const ringIdle = onLightSurface
    ? secondaryIconColor
    : "rgba(255,255,255,0.5)";

  const isEditing = editingId != null;
  const canSend = isEditing
    ? !!editDraft.trim() &&
      editDraft.trim() !==
        noteText(notes.find((n) => (n._id || n.id) === editingId))
    : !!draft.trim();
  const commit = isEditing ? saveEdit : handleSend;

  // While editing, collapse the list to JUST the edited note so the card stays
  // short and its editor sits high up, clear of the keyboard (showing the whole
  // list pushed the edited row down against the keyboard).
  const visibleNotes = isEditing
    ? notes.filter((n) => (n._id || n.id) === editingId)
    : notes;

  // Ring around the send arrow — shared by the iOS keyboard accessory and the
  // Android focused-only fallback. `accent` = enabled, `idle` = empty state.
  // `big` gives the larger white ring used on the keyboard accessory.
  const renderSendButton = (accent, idle, big = false) => (
    <TouchableOpacity
      style={[
        big ? extraStyles.sendBtnBig : extraStyles.sendBtn,
        { borderColor: canSend ? accent : idle },
      ]}
      onPress={commit}
      disabled={!canSend}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={t("notes.add", "Lägg till anteckning")}
    >
      {saving ? (
        <ActivityIndicator size="small" color={idle} />
      ) : (
        <Icon
          name="arrow-up"
          size={big ? 24 : 16}
          color={canSend ? accent : idle}
        />
      )}
    </TouchableOpacity>
  );

  const renderNoteItem = (note, index) => {
    const id = note._id || note.id || index;
    const editing = editingId === (note._id || note.id);
    const divider = index !== visibleNotes.length - 1 && styles.itemDivider;
    return (
      <View key={id} style={[extraStyles.item, divider]}>
        <Text style={styles.dateText}>
          {formatDate(note.updatedAt || note.createdAt)}
        </Text>
        {editing ? (
          <View style={extraStyles.editRow}>
            <TextInput
              style={[
                extraStyles.input,
                extraStyles.editInput,
                { color: styles.projectText.color },
              ]}
              value={editDraft}
              onChangeText={setEditDraft}
              onBlur={saveEdit}
              placeholderTextColor={styles.emptyText.color}
              // Enter inserts a newline and keeps the field open (submitBehavior
              // "newline"); save via the ring or by tapping away.
              multiline
              submitBehavior="newline"
              autoFocus
            />
            {/* Send lives right here in the row while editing (the keyboard
                accessory is unreliable for a 2nd input). */}
            {renderSendButton(ringAccent, ringIdle, true)}
          </View>
        ) : (
          // Tap the text to edit in place; tap the trash to delete.
          <View style={extraStyles.noteRow}>
            <TouchableOpacity
              style={extraStyles.noteTextWrap}
              activeOpacity={0.6}
              onPress={() => startEdit(note)}
            >
              <Text style={styles.projectText} numberOfLines={2}>
                {noteText(note) || t("notes.untitled")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={extraStyles.deleteBtn}
              onPress={() => confirmDelete(note)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t("notes.delete", "Ta bort")}
            >
              <Icon name="trash-2" size={16} color={secondaryIconColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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

        {/* Quick-add — write a note straight from Home. The send control lives on
            the keyboard (iOS InputAccessoryView) so it only shows while typing;
            Android falls back to an inline ring while the field is focused. */}
        <View style={extraStyles.inputRow}>
          <TextInput
            style={[extraStyles.input, { color: styles.dateText.color }]}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            // Always show the placeholder while the field is empty (iOS hides it
            // as soon as you type). Toggling it to "" on focus hit an RN quirk
            // where it wouldn't reappear after send until the input re-mounted.
            placeholder={t("notes.quickAdd", "Skriv en anteckning…")}
            placeholderTextColor={styles.emptyText.color}
            inputAccessoryViewID={
              Platform.OS === "ios" ? ACCESSORY_NEW : undefined
            }
            // Enter inserts a newline and keeps the field open (submitBehavior
            // "newline"); the note is sent only via the send ring (keyboard
            // accessory on iOS, inline ring on Android).
            multiline
            submitBehavior="newline"
          />
          {Platform.OS !== "ios" && focused && !isEditing
            ? renderSendButton(styles.linkText.color, secondaryIconColor)
            : null}
        </View>

        {loading ? null : !notes.length ? null : isEditing ? (
          // While editing, drop the nested ScrollView and render the single
          // edited note as a plain View in the Home ScrollView's own flow — so
          // its `automaticallyAdjustKeyboardInsets` lifts the growing multiline
          // editor above the keyboard, exactly like the quick-add field. Inside
          // the nested ScrollView the outer inset couldn't reach it and the
          // cursor slid under the keyboard.
          <View style={extraStyles.editList}>
            {visibleNotes.map(renderNoteItem)}
          </View>
        ) : (
          <ScrollView
            style={[styles.scrollArea, extraStyles.listBelow]}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {visibleNotes.map(renderNoteItem)}
          </ScrollView>
        )}
      </View>

      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={ACCESSORY_NEW}>
          <View style={extraStyles.accessoryBar}>
            {renderSendButton(ringAccent, ringIdle, true)}
          </View>
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
  // The inline editor sits where the note's text was, same size as the title.
  editInput: {
    fontSize: 15,
    marginTop: 1,
  },
  // Row holding the inline editor + its send ring while editing a note.
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  // Larger white ring for the keyboard accessory — visible on the coloured home.
  sendBtnBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  // Sits above the keyboard (iOS). Transparent + slim so it reads as just the
  // send ring floating over the keyboard, not a thick white bar.
  accessoryBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "transparent",
  },
  listBelow: {
    marginTop: 12,
    maxHeight: 132,
  },
  // Editing container: no maxHeight so the multiline editor can grow, and no
  // ScrollView so the Home keyboard-inset lifts it above the keyboard.
  editList: {
    marginTop: 12,
  },
  item: {
    gap: 4,
  },
  // Note text + trash side by side; text takes the room, trash sits at the end.
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noteTextWrap: {
    flex: 1,
  },
  deleteBtn: {
    paddingTop: 1,
    marginRight: 4,
  },
});

export default NotesPreview;
