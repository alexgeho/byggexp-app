import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/ThemeContext";
import { layout } from "../../../theme/spacing";

// The pinned action bar at the bottom of every form: always visible, so the
// main action never hides at the end of a long scroll. Children are 1–2
// <Button>s; each gets an equal share of the width.
// `safeBottom`: add the home-indicator inset (off when the screen's
// SafeAreaView already pads the bottom).
export function FormFooter({ children, safeBottom = true }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.content.surface,
          borderTopColor: theme.content.divider,
          paddingBottom: (safeBottom ? insets.bottom : 0) + layout.betweenCards,
        },
      ]}
    >
      {React.Children.map(children, (child) =>
        child ? <View style={styles.slot}>{child}</View> : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: layout.betweenCards,
    paddingHorizontal: layout.formGutter,
    paddingTop: layout.betweenCards,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  slot: { flex: 1 },
});

export default FormFooter;
