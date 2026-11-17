import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/ThemeContext";
import { layout } from "../../../theme/spacing";

// The pinned action bar at the bottom of every form: always visible, so the
// main action never hides at the end of a long scroll. Children are 1–2
// <Button>s; each gets an equal share of the width.
// `top`: more actions on a row of their own above the main one (delete · copy
// · move), so the main button keeps the full width.
// `safeBottom`: add the home-indicator inset (off when the screen's
// SafeAreaView already pads the bottom).
export function FormFooter({ children, top = null, safeBottom = true }) {
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
      {top ? (
        <View style={styles.row}>
          {React.Children.map(top, (child) =>
            child ? <View style={styles.slot}>{child}</View> : null,
          )}
        </View>
      ) : null}
      <View style={styles.row}>
        {React.Children.map(children, (child) =>
          child ? <View style={styles.slot}>{child}</View> : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: layout.betweenCards,
    paddingHorizontal: layout.formGutter,
    paddingTop: layout.betweenCards,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", gap: layout.betweenCards },
  slot: { flex: 1 },
});

export default FormFooter;
