import React, { useMemo } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { useAppInformation } from "../../hooks/useAppInformation";
import { createStyles } from "./LegalPoliciesScreen.styles";
import { useTheme } from "../../theme/ThemeContext";

function BulletSection({ title, items, theme, styles }) {
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
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
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
          styles={styles}
          title={t("legal.collectedTitle")}
          items={t("legal.collected", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          styles={styles}
          title={t("legal.usageTitle")}
          items={t("legal.usage", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          styles={styles}
          title={t("legal.protectionTitle")}
          items={t("legal.protection", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          styles={styles}
          title={t("legal.rightsTitle")}
          items={t("legal.rights", { returnObjects: true })}
          theme={theme}
        />

        <BulletSection
          styles={styles}
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
