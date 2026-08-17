import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { radius, spacing, fontSize } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Unified person row shared by every people list (worker pickers, chat list…).
// Single source of truth so lists cannot drift apart. Optional props cover the
// chat-specific extras (time, unread count, long-press, avatar tap).
export const PersonListItem = ({
  person = {},
  subtitle,
  meta, // optional second sub-line (e.g. project assignment on the employees list)
  statusBadge, // { label, backgroundColor, color }
  selectable = false,
  selected = false,
  timeAgo, // small grey suffix after the name (chat)
  unread = 0, // blue unread-count badge (chat, when not selecting)
  onPress,
  onLongPress,
  onAvatarPress,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const avatar = <Avatar name={person.name} uri={person.avatarUrl} size={44} />;

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {onAvatarPress ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onAvatarPress}>
          {avatar}
        </TouchableOpacity>
      ) : (
        avatar
      )}

      <View style={styles.rowBody}>
        <Text
          style={[styles.rowName, selected && styles.rowTextOnSel]}
          numberOfLines={1}
        >
          {person.name || "—"}
          {timeAgo ? (
            <Text style={[styles.rowTime, selected && styles.rowTimeOnSel]}>
              {`  •  ${timeAgo}`}
            </Text>
          ) : null}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.rowPreview, selected && styles.rowTextOnSel]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text
            style={[styles.rowMeta, selected && styles.rowTextOnSel]}
            numberOfLines={1}
          >
            {meta}
          </Text>
        ) : null}
      </View>

      {/* Trailing: status badge on top. Selection is shown by the whole card
          turning blue (rowSelected) — no radio, matching the Figma design. */}
      <View style={styles.rowRight}>
        {statusBadge ? (
          <Badge
            label={statusBadge.label}
            backgroundColor={statusBadge.backgroundColor}
            color={statusBadge.color}
          />
        ) : null}
        {!selectable && unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unread > 9 ? "9+" : unread}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surface,
      borderRadius: radius.lg,
      // Figma: card padding 10 all sides, 10px gap between cards.
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm + 2,
      marginBottom: spacing.sm + 2,
    },
    rowRight: {
      alignSelf: "flex-start",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      gap: spacing.lg,
    },
    rowSelected: {
      backgroundColor: "rgba(12, 119, 253, 0.6)",
      borderColor: "rgba(12, 119, 253, 0.6)",
    },
    rowBody: {
      flex: 1,
      alignSelf: "flex-start",
      // Tight line spacing: name stays anchored to the top (aligned with the
      // badge's top edge); profession + project sit just under it.
      gap: 4,
    },
    rowName: {
      color: c.textPrimary,
      fontSize: fontSize.title,
      fontWeight: "500",
    },
    rowTime: {
      color: c.textMuted,
      fontSize: fontSize.footnote,
      fontWeight: "500",
    },
    rowTimeOnSel: {
      color: "rgba(255, 255, 255, 0.85)",
    },
    rowPreview: {
      color: c.textMuted,
      fontSize: fontSize.footnote,
      fontWeight: "500",
    },
    rowMeta: {
      color: c.placeholder,
      fontSize: fontSize.caption,
      fontWeight: "500",
    },
    rowTextOnSel: {
      color: c.onAccent,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: radius.full,
      paddingHorizontal: 5,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    unreadBadgeText: {
      color: c.onAccent,
      fontSize: 11,
      fontWeight: "700",
    },
  });

export default PersonListItem;
