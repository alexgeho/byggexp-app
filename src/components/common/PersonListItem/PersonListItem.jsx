import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { resolveUploadUrl } from "../../../utils/shifts";

const getInitials = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Unified person row shared by the employee/worker lists — same visual as the
// chat list (avatar, name, subtitle, optional status badge + selection circle).
export const PersonListItem = ({
  person = {},
  subtitle,
  statusBadge, // { label, backgroundColor, color }
  selectable = false,
  selected = false,
  onPress,
}) => {
  const avatarUri = person.avatarUrl
    ? resolveUploadUrl(person.avatarUrl)
    : null;

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitials}>{getInitials(person.name)}</Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <Text
          style={[styles.rowName, selected && styles.rowTextOnSel]}
          numberOfLines={1}
        >
          {person.name || "—"}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.rowPreview, selected && styles.rowTextOnSel]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowRight}>
        {statusBadge ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusBadge.backgroundColor },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusBadge.color }]}
            >
              {statusBadge.label}
            </Text>
          </View>
        ) : null}
        {selectable ? (
          <View style={[styles.checkCircle, selected && styles.checkCircleOn]}>
            {selected ? <Icon name="check" size={15} color="#0785F4" /> : null}
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
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowSelected: {
    backgroundColor: "rgba(12, 119, 253, 0.6)",
    borderColor: "rgba(12, 119, 253, 0.6)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D9D9D9",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#052D50",
    fontSize: 15,
    fontWeight: "700",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: "#052D50",
    fontSize: 17,
    fontWeight: "500",
  },
  rowPreview: {
    color: "#667E93",
    fontSize: 13,
    fontWeight: "500",
  },
  rowTextOnSel: {
    color: "#FFFFFF",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C3D2E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginRight: 4,
  },
  checkCircleOn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
});

export default PersonListItem;
