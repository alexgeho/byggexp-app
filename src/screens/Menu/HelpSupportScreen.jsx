import React, { useMemo } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { createStyles } from "./HelpSupportScreen.styles";
import { useTheme } from "../../theme/ThemeContext";

const SUPPORT_PHONE = "+46 812 410 276";
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/[^0-9]/g, "")}`;
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
  styles,
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
          {t("help.title")}
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
            {t("help.contactOptions")}
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("help.subtitle")}
          </Text>
        </View>

        <SupportCard
          styles={styles}
          iconName="phone"
          iconColor={theme.colors.primary}
          title={t("help.callTitle")}
          value={SUPPORT_PHONE}
          description={t("help.callDescription")}
          onPress={() =>
            openExternalUrl(`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`)
          }
          theme={theme}
        />

        <SupportCard
          styles={styles}
          iconName="mail"
          iconColor={theme.colors.primary}
          title={t("help.emailTitle")}
          value={SUPPORT_EMAIL}
          description={t("help.emailDescription")}
          onPress={() => openExternalUrl(`mailto:${SUPPORT_EMAIL}`)}
          theme={theme}
        />

        <SupportCard
          styles={styles}
          iconName="message-circle"
          iconColor={theme.colors.primary}
          title={t("help.chatTitle")}
          description={t("help.chatDescription")}
          onPress={() => openExternalUrl(SUPPORT_WHATSAPP_URL)}
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
