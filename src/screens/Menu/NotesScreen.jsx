import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Feather";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { notesService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { getDateLocale } from "../../utils/dateLocale";
import { getEntityId } from "../../utils/entityId";
import { createStyles } from "./NotesScreen.styles";

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

export default function NotesScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesService.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load notes:", error);
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
            {t("notes.title")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.scrollContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            data={notes}
            keyExtractor={(note) => getEntityId(note)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t("notes.emptyTitle")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("notes.emptySubtitle")}
                </Text>
              </View>
            }
            renderItem={({ item: note }) => {
              const title = (note.title || "").trim();
              const body = (note.body || "").trim();
              // Swipe left deletes, like every other list in the app.
              const deleteNote = async () => {
                const id = getEntityId(note);
                try {
                  await notesService.remove(id);
                  setNotes((previous) =>
                    previous.filter((item) => getEntityId(item) !== id),
                  );
                } catch (error) {
                  console.error("Failed to delete note:", error);
                  Alert.alert(t("common.error"), t("notes.deleteFailed"));
                }
              };
              return (
                <Swipeable
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={swipeStyles.deleteAction}
                      activeOpacity={0.85}
                      onPress={deleteNote}
                      accessibilityRole="button"
                      accessibilityLabel={t("common.delete")}
                    >
                      <Icon name="trash-2" size={22} color="#FFFFFF" />
                      <Text style={swipeStyles.deleteText}>
                        {t("common.delete")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  overshootRight={false}
                  friction={2}
                  rightThreshold={40}
                >
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate("CreateNote", {
                        noteId: getEntityId(note),
                      })
                    }
                  >
                    <Text style={styles.cardDate}>
                      {formatDate(note.updatedAt || note.createdAt)}
                    </Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {title || t("notes.untitled")}
                    </Text>
                    {body ? (
                      <Text style={styles.cardBody} numberOfLines={3}>
                        {body}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
          />
        )}

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton
          onAddPress={() => navigation.navigate("CreateNote")}
        />
      </View>
    </View>
  );
}

// The red slab the shared entity list reveals behind a swiped card.
const swipeStyles = StyleSheet.create({
  deleteAction: {
    backgroundColor: "#FF3B30",
    width: 92,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
