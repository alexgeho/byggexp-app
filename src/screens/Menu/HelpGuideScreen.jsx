import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
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
          {t("guide.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

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
    </View>
  );
}
