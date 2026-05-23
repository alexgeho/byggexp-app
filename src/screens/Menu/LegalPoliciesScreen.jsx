import React from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { useAppInformation } from "../../hooks/useAppInformation";
import { standardScreenHeaderSpacing } from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";

const COLLECTED_DATA = [
  "Personal information provided during registration (name, phone number, email)",
  "Work-related data such as time logs, project details, and GPS locations (only during working hours, as configured by your employer)",
  "Communication and documents exchanged within the app",
];

const DATA_USAGE = [
  "To provide and improve our services",
  "To facilitate communication and project management between office, foremen, and workers",
  "To comply with legal obligations and improve security",
];

const DATA_PROTECTION = [
  "Your data is securely stored both locally and in the cloud",
  "Access is protected by login/password and other secure authentication methods",
  "We do not share your personal information with third parties except as required by law or with your consent",
];

const USER_RIGHTS = [
  "You may request access, correction, or deletion of your personal data at any time",
  "You can contact our support team regarding privacy questions or data removal requests",
];

const LEGAL_NOTICE = [
  "By using Bygg App, you agree to our Terms of Service and this Privacy Policy",
  "For more information, please review the full documents available in the app or on our website",
];

function BulletSection({ title, items, theme }) {
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

      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
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
}

export default function LegalPoliciesScreen() {
  const navigation = useNavigation();
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
          Legal & Policies
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
            Privacy Policy & Legal Information
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Your privacy is important to us. Bygg App is committed to
            protecting your personal data and ensuring transparency in how your
            information is collected, used, and stored.
          </Text>
        </View>

        <BulletSection
          title="What data do we collect?"
          items={COLLECTED_DATA}
          theme={theme}
        />

        <BulletSection
          title="How do we use your data?"
          items={DATA_USAGE}
          theme={theme}
        />

        <BulletSection
          title="Data Protection"
          items={DATA_PROTECTION}
          theme={theme}
        />

        <BulletSection
          title="Your Rights"
          items={USER_RIGHTS}
          theme={theme}
        />

        <BulletSection
          title="Legal Notice"
          items={LEGAL_NOTICE}
          theme={theme}
        />

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            Contact
          </Text>

          <Text
            style={[
              styles.paragraph,
              styles.paragraphLast,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            For any privacy-related questions, please contact us using the
            details below.
          </Text>
        </View>

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            App Information
          </Text>

          {appInformationRows.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.infoRow,
                index !== appInformationRows.length - 1 && styles.infoRowDivider,
              ]}
            >
              <Text
                style={[
                  styles.infoLabel,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {item.label}
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
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...standardScreenHeaderSpacing,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    width: 36,
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
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
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
