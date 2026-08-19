import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Screen } from "../../components/common/Screen/Screen";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { createStyles } from "./LanguageScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import { SUPPORTED_LANGUAGES, setLanguage } from "../../i18n";

export default function LanguageScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.language;

  return (
    <Screen title={t("language.title")} onBack={() => navigation.goBack()}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.groupCard}>
          {SUPPORTED_LANGUAGES.map((language, index) => {
            const isActive = activeLanguage === language.code;

            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageRow,
                  index !== SUPPORTED_LANGUAGES.length - 1 &&
                    styles.languageRowDivider,
                ]}
                onPress={() => setLanguage(language.code)}
              >
                <Text
                  style={[
                    styles.languageLabel,
                    { fontFamily: theme.text.fontFamily.semiBold },
                  ]}
                >
                  {language.label}
                </Text>

                <View
                  style={[
                    styles.checkbox,
                    { borderColor: `${theme.colors.primary}66` },
                    isActive && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  {isActive && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </Screen>
  );
}
