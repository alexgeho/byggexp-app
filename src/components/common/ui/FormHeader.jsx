import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BackButton } from "../BackButton/BackButton";
import { HeaderCheckButton } from "./HeaderCheckButton";
import { useTheme } from "../../../theme/ThemeContext";
import { layout } from "../../../theme/spacing";
import { size } from "../../../theme/tokens";

// Header of a create/edit form inside a top SafeAreaView: round back (left),
// centred title, round save check (right). One component so every form's
// header is the same height, gutter, title size and weight.
export function FormHeader({ title, onBack, onSave, saving, saveLabel }) {
  const { theme } = useTheme();
  return (
    <View style={styles.header}>
      <BackButton
        onPress={onBack}
        iconSource={require("../../../assets/Arrow-left.png")}
      />
      <Text
        style={[styles.title, { color: theme.content.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {onSave ? (
        <HeaderCheckButton
          onPress={onSave}
          loading={saving}
          accessibilityLabel={saveLabel}
        />
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.formGutter,
    paddingVertical: layout.headerToContent,
    gap: layout.headerToContent,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },
  spacer: { width: size.headerButton },
});

export default FormHeader;
