import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { content, radius, spacing, fontSize } from "../../../theme/tokens";

// Unified person row shared by every people list (worker pickers, chat list…).
// Single source of truth so lists cannot drift apart. Optional props cover the
// chat-specific extras (time, unread count, long-press, avatar tap).
export const PersonListItem = ({
  person = {},
  subtitle,
  statusBadge, // { label, backgroundColor, color }
  selectable = false,
  selected = false,
  timeAgo, // small grey suffix after the name (chat)
  unread = 0, // blue unread-count badge (chat, when not selecting)
  onPress,
  onLongPress,
  onAvatarPress,
}) => {
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
        </Text>
        {subtitle || timeAgo ? (
          <Text
            style={[styles.rowPreview, selected && styles.rowTextOnSel]}
            numberOfLines={1}
          >
            {subtitle}
            {timeAgo ? (
              <Text style={[styles.rowTime, selected && styles.rowTimeOnSel]}>
                {subtitle ? `  •  ${timeAgo}` : timeAgo}
              </Text>
            ) : null}
          </Text>
        ) : null}
      </View>

      {/* Trailing column: status badge on top, selection radio / unread below.
          Kept in-flow so the body shrinks (long names never run under it); the
          group is vertically centred by the row, so the radio sits near the
          middle of the taller card. */}
      <View style={styles.rowRight}>
        {statusBadge ? (
          <Badge
            label={statusBadge.label}
            backgroundColor={statusBadge.backgroundColor}
            color={statusBadge.color}
          />
        ) : null}
        {selectable ? (
          <View style={[styles.checkCircle, selected && styles.checkCircleOn]}>
            {selected ? <Icon name="check" size={15} color="#0785F4" /> : null}
          </View>
        ) : unread > 0 ? (
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: content.surface,
    borderWidth: 1,
    borderColor: content.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
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
    gap: 10,
  },
  rowName: {
    color: content.textPrimary,
    fontSize: fontSize.title,
    fontWeight: "500",
  },
  rowTime: {
    color: content.textMuted,
    fontSize: fontSize.footnote,
    fontWeight: "500",
  },
  rowTimeOnSel: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  rowPreview: {
    color: content.textMuted,
    fontSize: fontSize.footnote,
    fontWeight: "500",
  },
  rowTextOnSel: {
    color: content.onAccent,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "#C3D2E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginRight: spacing.xxxl,
  },
  checkCircleOn: {
    backgroundColor: content.surface,
    borderColor: content.surface,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    backgroundColor: content.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  unreadBadgeText: {
    color: content.onAccent,
    fontSize: 11,
    fontWeight: "700",
  },
});

export default PersonListItem;
