import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { useAppInformation } from "../../hooks/useAppInformation";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";

function BulletSection({ title, items, theme }) {
  const bulletItems = Array.isArray(items) ? items : [];
  return (
    <View style={styles.groupCard}>
      <Text
        style={[
          styles.sectionTitle,
          { fontFamily: theme.text.fontFamily.semiBold },
        ]}
      >
        {title}
      </Text>

      {bulletItems.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <View
            style={[styles.bullet, { backgroundColor: theme.colors.primary }]}
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
}

export default function LegalPoliciesScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { appInformationRows, loadingInfo } = useAppInformation();

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
          {t("legal.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIconWrap,
              { backgroundColor: `${theme.colors.primary}1A` },
            ]}
          >
            <Image
              source={require("../../assets/Legal.png")}
              style={[styles.heroIcon, { tintColor: theme.colors.primary }]}
            />
          </View>

          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("legal.heroTitle")}
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("legal.heroText")}
          </Text>
        </View>

        <BulletSection
          title={t("legal.collectedTitle")}
          items={t("legal.collected", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          title={t("legal.usageTitle")}
          items={t("legal.usage", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          title={t("legal.protectionTitle")}
          items={t("legal.protection", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          title={t("legal.rightsTitle")}
          items={t("legal.rights", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          title={t("legal.noticeTitle")}
          items={t("legal.notice", { returnObjects: true })}
          theme={theme}
        />

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("legal.contactTitle")}
          </Text>

          <Text
            style={[
              styles.paragraph,
              styles.paragraphLast,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("legal.contactText")}
          </Text>
        </View>

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("about.infoTitle")}
          </Text>

          {appInformationRows.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.infoRow,
                index !== appInformationRows.length - 1 &&
                  styles.infoRowDivider,
              ]}
            >
              <Text
                style={[
                  styles.infoLabel,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {t(`about.info.${item.key}`, item.label)}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {item.value}
              </Text>
            </View>
          ))}

          {loadingInfo ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}
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
    width: "100%",
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 120,
  },
  heroCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 32,
    height: 32,
  },
  heroTitle: {
    color: "#052D50",
    fontSize: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  heroText: {
    color: "#698196",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  groupCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 20,
  },
  sectionTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: "#052D50",
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    color: "#052D50",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  paragraphLast: {
    marginBottom: 0,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e9e9e9",
  },
  infoLabel: {
    color: "#698196",
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    color: "#052D50",
    fontSize: 15,
    lineHeight: 22,
  },
  loadingRow: {
    paddingTop: 12,
    alignItems: "flex-start",
  },
});
