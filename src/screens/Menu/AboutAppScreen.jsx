import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { useTheme } from "../../theme/ThemeContext";

const APP_FEATURES = [
  "Track working hours both manually and automatically using GPS",
  "Receive and send drawings, tasks, and important documents between the office, foremen, and workers",
  "Manage projects efficiently, receive timely notifications about new tasks, changes, and possible violations on site",
  "Ensure transparency and control over all construction site activities",
];

const APP_INFO = [
  { label: "Version", value: "1.0" },
  { label: "Developer", value: "[Your Company Name]" },
  { label: "Contact", value: "[email/website/phone]" },
];

export default function AboutAppScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const accentTint = { tintColor: theme.colors.primary };

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
          About the App
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
              source={require("../../assets/About.png")}
              style={[styles.heroIcon, accentTint]}
            />
          </View>

          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            Bygg App
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Bygg App is a modern solution for construction project management
            and work hour tracking on construction sites.
          </Text>
        </View>

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            The app allows you to
          </Text>

          {APP_FEATURES.map((item) => (
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

        <View style={styles.groupCard}>
          <Text
            style={[
              styles.paragraph,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Bygg App is available for Android and iOS, protected by modern
            authentication methods, and fully complies with privacy and data
            security standards.
          </Text>

          <Text
            style={[
              styles.paragraph,
              styles.paragraphLast,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            If you have any questions or suggestions, please contact our
            support team through the settings menu.
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

          {APP_INFO.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.infoRow,
                index !== APP_INFO.length - 1 && styles.infoRowDivider,
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
    paddingBottom: 48,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 10,
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
});
