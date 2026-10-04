import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { useCardStyles } from "../../styles/cards";
import { space } from "../../theme/spacing";

// Contract upload zone — the app's dashed "add" pattern, sized as the main
// entry point. Shared by Ny egenkontroll and the empty solo home.
//   status: "idle" | "reading" | "error"
//   stage:  text while reading ("Läser avtalet…" → "Skapar kontrollpunkter…")
//   onCancel: "Avbryt" while reading
export default function UploadZone({
  status = "idle",
  stage,
  onPress,
  onCancel,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.content;
  const cardStyles = useCardStyles();
  const blue = theme.colors.primary;
  const reading = status === "reading";
  const failed = status === "error";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={reading}
      style={[
        styles.zone,
        { borderColor: `${blue}66`, backgroundColor: `${blue}0F` },
      ]}
    >
      <View
        style={[styles.icon, { backgroundColor: failed ? c.danger : blue }]}
      >
        {reading ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Icon
            name={failed ? "alert-circle" : "file-text"}
            size={26}
            color={c.onAccent}
          />
        )}
      </View>
      <Text style={[styles.title, { color: failed ? c.danger : blue }]}>
        {reading
          ? stage
          : failed
            ? t("egenkontroll.readFailedShort")
            : t("egenkontroll.onboardingContract")}
      </Text>
      {reading ? (
        <Text
          style={[cardStyles.cardSecondaryText, { color: blue }]}
          onPress={onCancel}
          suppressHighlighting
        >
          {t("common.cancel")}
        </Text>
      ) : failed ? (
        <Text style={[cardStyles.cardSecondaryText, { color: blue }]}>
          {t("egenkontroll.tryAgain")}
        </Text>
      ) : (
        <Text style={cardStyles.cardSecondaryText}>PDF · foto</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  zone: {
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xs,
  },
  title: { fontSize: 17, fontWeight: "600", textAlign: "center" },
});
