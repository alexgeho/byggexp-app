import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { standardScreenHeaderSpacing } from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";

const SUPPORT_PHONE = "+46 812 410 276";
const SUPPORT_EMAIL = "support@byggexp.se";

async function openExternalUrl(url) {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    return;
  }

  await Linking.openURL(url);
}

function SupportCard({
  iconName,
  iconColor,
  title,
  value,
  description,
  onPress,
  theme,
}) {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.supportCard}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <Icon name={iconName} size={24} color={iconColor} />
      </View>

      <View style={styles.cardContent}>
        <Text
          style={[
            styles.cardTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {title}
        </Text>

        {value ? (
          <Text
            style={[
              styles.cardValue,
              {
                color: iconColor,
                fontFamily: theme.text.fontFamily.semiBold,
              },
            ]}
          >
            {value}
          </Text>
        ) : null}

        <Text
          style={[
            styles.cardDescription,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {description}
        </Text>
      </View>
    </CardComponent>
  );
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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
          Help & Support
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
          <Icon name="help-circle" size={32} color={theme.colors.primary} />
          </View>

          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            Contact options
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            Reach our support team using the contact methods below.
          </Text>
        </View>

        <SupportCard
          iconName="phone"
          iconColor={theme.colors.primary}
          title="Call support"
          value={SUPPORT_PHONE}
          description={"Available:\nMon-Fri • 08:00-17:00"}
          onPress={() => openExternalUrl(`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`)}
          theme={theme}
        />

        <SupportCard
          iconName="mail"
          iconColor={theme.colors.primary}
          title="Email support"
          value={SUPPORT_EMAIL}
          description="Usually responds within 24 hours"
          onPress={() => openExternalUrl(`mailto:${SUPPORT_EMAIL}`)}
          theme={theme}
        />

        <SupportCard
          iconName="message-circle"
          iconColor={theme.colors.primary}
          title="Support chat"
          description="Chat directly with our support team"
          theme={theme}
        />
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
  supportCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 20,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    marginBottom: 6,
  },
  cardDescription: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 21,
  },
});
