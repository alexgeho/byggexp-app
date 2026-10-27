import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { radius, size, spacing, fontSize } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Single-choice pill row (client type, payment terms, currency…). Selected =
// filled primary; the rest = outline, all one height. tone="soft": a quiet
// choice (not the screen's main action) — selected = grey fill, black text.
export const ChoiceChips = ({ values, value, onChange, format, tone }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  return (
    <View style={styles.row}>
      {values.map((v) => {
        const active = value === v;
        const soft = tone === "soft";
        return (
          <TouchableOpacity
            key={v}
            style={[
              styles.chip,
              active &&
                (soft
                  ? {
                      backgroundColor: theme.content.inputSurface,
                      borderColor: "transparent",
                    }
                  : {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    }),
            ]}
            onPress={() => onChange(v)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.text,
                active && !soft && { color: theme.content.onAccent },
              ]}
            >
              {format ? format(v) : v}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (c) =>
  StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      height: 36,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.control,
      borderWidth: size.border,
      borderColor: c.border,
    },
    text: {
      color: c.textPrimary,
      fontSize: fontSize.body,
      fontWeight: "500",
    },
  });

export default ChoiceChips;
