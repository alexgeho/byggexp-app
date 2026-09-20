import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
// Share the project filter's trigger styling so every list filter looks the
// same — change it there and both follow.
import { createStyles as createTriggerStyles } from "../ProjectFilterSelector/ProjectFilterSelector.styles";

// A list filter shaped like the project one ("Alla projekt" pill with a
// chevron), but picking from a plain set of options in a sheet instead of
// drilling into another screen.
export function FilterSelector({ value, options, onChange, placeholder }) {
  const { theme } = useTheme();
  const triggerStyles = useMemo(
    () => createTriggerStyles(theme.content),
    [theme.content],
  );
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <View style={triggerStyles.container}>
      <TouchableOpacity
        style={triggerStyles.trigger}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={selected?.label || placeholder}
        onPress={() => setOpen(true)}
      >
        <Text
          style={[
            triggerStyles.triggerText,
            !selected && triggerStyles.triggerPlaceholder,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {selected?.label || placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={theme.content.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grab} />
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={styles.row}
                  activeOpacity={0.8}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowText} numberOfLines={1}>
                    {option.label}
                  </Text>
                  {option.value === value ? (
                    <Icon name="check" size={18} color="#0785F4" />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(5, 45, 80, 0.28)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 8,
      maxHeight: "60%",
    },
    grab: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.divider,
      marginBottom: 12,
    },
    row: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 16,
    },
  });

export default FilterSelector;
