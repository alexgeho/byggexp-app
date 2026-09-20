import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { BackButton } from "../BackButton/BackButton";
import { BottomBar } from "../BottomBar/BottomBar";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// The one entity-list screen: header, optional filter chips, cards, swipe-left
// delete and a "+" that opens the create screen. Every list (clients, articles,
// offers, invoices…) renders through this, so a change to the layout, the
// swipe action or the empty state lands on all of them at once.
//
// Props:
//   title        header text
//   data         rows to render
//   loading      shows a spinner instead of the list
//   keyExtractor (item, index) => string
//   renderCard   (item) => element — just the card; the swipe wrapper is ours
//   filters      [{ value, label }] — omit for no filter row
//   activeFilter / onFilterChange
//   onDelete     (item) => Promise — omit to disable swipe-delete
//   emptyText    shown when there is nothing to list
//   addScreen    route the "+" opens (omit to hide "+")
//   headerRight  optional element in place of the header's right spacer
//   beforeList   element rendered under the filters — for a screen's own
//                controls (a project filter, status pills…)
//   sections / renderSectionHeader — render a SectionList instead of a flat
//                list, for lists grouped by something (tasks by project)
//   listHeader   element pinned above the first row (an "all projects" card…)
//   onBack / onNavigateHome / onNavigateMenu — override the default
//                navigation, for a screen that has to guard leaving
//   onAdd        function alternative to addScreen
export function EntityListScreen({
  title,
  data,
  loading = false,
  keyExtractor,
  renderCard,
  filters,
  activeFilter,
  onFilterChange,
  onDelete,
  emptyText,
  addScreen,
  addParams,
  headerRight,
  beforeList,
  sections,
  renderSectionHeader,
  listHeader,
  onBack,
  onNavigateHome,
  onNavigateMenu,
  onAdd,
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const renderDeleteAction = useCallback(
    (item) => (
      <TouchableOpacity
        style={styles.swipeDeleteAction}
        activeOpacity={0.85}
        onPress={() => onDelete(item)}
        accessibilityRole="button"
        accessibilityLabel={t("common.delete")}
      >
        <Icon name="trash-2" size={22} color="#FFFFFF" />
        <Text style={styles.swipeDeleteText}>{t("common.delete")}</Text>
      </TouchableOpacity>
    ),
    [onDelete, styles, t],
  );

  // One row, wrapped in the swipe action when the screen allows deleting.
  const renderRow = useCallback(
    (item) => {
      const card = renderCard(item);
      if (!onDelete) {
        return card;
      }
      return (
        <Swipeable
          renderRightActions={() => renderDeleteAction(item)}
          overshootRight={false}
          friction={2}
          rightThreshold={40}
        >
          {card}
        </Swipeable>
      );
    },
    [onDelete, renderCard, renderDeleteAction],
  );

  const emptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{emptyText}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={onBack || (() => navigation.goBack())}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>{title}</Text>
          {headerRight || <View style={styles.headerSpacer} />}
        </View>

        {filters?.length ? (
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => onFilterChange(filter.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {beforeList}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : sections ? (
          <SectionList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            sections={sections}
            keyExtractor={keyExtractor}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={emptyComponent}
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => renderRow(item)}
          />
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            data={data}
            keyExtractor={keyExtractor}
            ListEmptyComponent={emptyComponent}
            ListHeaderComponent={listHeader}
            renderItem={({ item }) => renderRow(item)}
          />
        )}

        <BottomBar
          onLeftPress={onNavigateHome || (() => navigation.navigate("Main"))}
          onRightPress={onNavigateMenu || (() => navigation.navigate("Menu"))}
          showAddButton={Boolean(addScreen || onAdd)}
          onAddPress={() =>
            onAdd
              ? onAdd()
              : addScreen && navigation.navigate(addScreen, addParams)
          }
        />
      </View>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: {
      width: 44,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 16,
      height: 36,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
    },
    filterChipActive: {
      backgroundColor: "#0785F4",
    },
    filterText: {
      color: c.textPrimary,
      fontSize: 14,
    },
    filterTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      paddingBottom: 140,
    },
    // Red slab revealed behind a swiped card.
    swipeDeleteAction: {
      backgroundColor: "#FF3B30",
      width: 92,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      marginBottom: 12,
    },
    swipeDeleteText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
    emptyState: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: "center",
    },
  });

export default EntityListScreen;
