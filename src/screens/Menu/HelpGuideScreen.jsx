import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { Screen } from "../../components/common/Screen/Screen";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { openWelcomeTour } from "../../components/common/WelcomeSlides/WelcomeSlides";
import { createStyles } from "./HelpGuideScreen.styles";
import { useTheme } from "../../theme/ThemeContext";

const SECTIONS = [
  { titleKey: "guide.gettingStartedTitle", itemsKey: "guide.gettingStarted" },
  { titleKey: "guide.shiftsTitle", itemsKey: "guide.shifts" },
  { titleKey: "guide.tasksTitle", itemsKey: "guide.tasks" },
  { titleKey: "guide.projectsTitle", itemsKey: "guide.projects" },
  {
    titleKey: "guide.communicationTitle",
    itemsKey: "guide.communication",
  },
];

export default function HelpGuideScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  return (
    <Screen title={t("guide.title")} onBack={() => navigation.goBack()}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("guide.intro")}
          </Text>

          <TouchableOpacity
            style={[
              styles.replayButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={openWelcomeTour}
            activeOpacity={0.85}
          >
            <Icon name="play-circle" size={18} color={theme.content.onAccent} />
            <Text
              style={[
                styles.replayButtonText,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("guide.replayTour")}
            </Text>
          </TouchableOpacity>
        </View>

        {SECTIONS.map((section) => {
          const items = t(section.itemsKey, { returnObjects: true });
          return (
            <View key={section.titleKey} style={styles.groupCard}>
              <Text
                style={[
                  styles.sectionTitle,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                {t(section.titleKey)}
              </Text>
              {(Array.isArray(items) ? items : []).map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                  <View
                    style={[
                      styles.bullet,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.bulletText,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </Screen>
  );
}
