import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";
import { SUPPORTED_LANGUAGES, setLanguage } from "../../i18n";

export default function LanguageScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.language;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF"
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {t("language.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
    gap: 14,
  },
  groupCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  languageRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e9e9e9",
  },
  languageLabel: {
    color: "#052D50",
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
