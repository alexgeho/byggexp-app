import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";

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
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Avatar name={person.name} uri={person.avatarUrl} size={44} />

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
