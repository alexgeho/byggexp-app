import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/common/ui";
import { useCardStyles } from "../../styles/cards";
import { space } from "../../theme/spacing";

// Load failed (network / server): one line + a blue "Försök igen" — never an
// endless spinner.
// textColor: over the home gradient.
export default function LoadError({ onRetry, loading = false, textColor }) {
  const { t } = useTranslation();
  const cardStyles = useCardStyles();
  return (
    <View style={styles.wrap}>
      <Text
        style={[
          cardStyles.cardSecondaryText,
          styles.text,
          textColor ? { color: textColor } : null,
        ]}
      >
        {t("egenkontroll.loadFailed")}
      </Text>
      <Button
        icon="refresh-cw"
        title={t("egenkontroll.retry")}
        onPress={onRetry}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg, paddingVertical: space.xxl },
  text: { textAlign: "center" },
});
