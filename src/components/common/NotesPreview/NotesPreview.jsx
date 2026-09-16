import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
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

      <View
        style={[
          styles.card,
          !loading && notes.length <= 1 && extraStyles.cardShort,
        ]}
      >
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Icon name="x" size={18} color={secondaryIconColor} />
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : notes.length ? (
          <ScrollView
            style={styles.scrollArea}
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
                    {title || t("notes.untitled")}
                  </Text>
                  {body ? (
                    <Text
                      style={[
                        extraStyles.bodyText,
                        { color: styles.emptyText.color },
                      ]}
                      numberOfLines={1}
                    >
                      {body}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.emptyState}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateNote")}
          >
            <Icon name="edit-3" size={26} color={styles.emptyText.color} />
            <Text style={styles.emptyText}>{t("notesPreview.empty")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const extraStyles = StyleSheet.create({
  cardShort: {
    height: 120,
  },
  item: {
    gap: 4,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: "DMSans-Regular",
  },
});

export default NotesPreview;
