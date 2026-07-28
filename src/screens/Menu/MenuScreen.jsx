import React, { useContext, useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeContext";
import { ScrollView } from "react-native";
import { MenuButton } from "../../components/common/MenuButton/MenuButton";
import AuthContext from "../../contexts/AuthContext";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { createStyles } from "./MenuScreen.styles";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.byggexp.se";

const resolveImageUrl = (value) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

export default function MenuScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user, logout } = useContext(AuthContext);
  const avatarSource = resolveImageUrl(user?.avatarUrl);

  const menuItems = useMemo(() => {
    const baseItems = [
      {
        id: "customizeHome",
        screen: "CustomizeHomeScreen",
        title: t("menu.customizeHome"),
        icon: require("../../assets/Home.png"),
        color: theme.colors.primary,
      },
      {
        id: "account",
        screen: "MyAccount",
        title: t("menu.myAccount"),
        icon: require("../../assets/Account.png"),
        color: theme.colors.primary,
      },
      {
        id: "notifications",
        screen: "NotificationsSettings",
        title: t("menu.notifications"),
        icon: require("../../assets/Notifications.png"),
        color: theme.colors.primary,
      },
      {
        id: "documents",
        screen: "Documents",
        title: t("menu.documents"),
        icon: require("../../assets/Documents.png"),
        color: theme.colors.primary,
      },
    ];

    const employeesItem = {
      id: "employees",
      screen: "Employees",
      title: t("menu.employees"),
      icon: require("../../assets/mainButtons/employees.png"),
      color: theme.colors.primary,
    };

    const toolsItem = {
      id: "tools",
      screen: "Tools",
      title: t("menu.instruments"),
      icon: require("../../assets/Tracker.png"),
      color: theme.colors.primary,
    };

    const planningItem = {
      id: "planning",
      screen: "Schedule",
      title: t("menu.planning"),
      icon: require("../../assets/WorkShifts.png"),
      color: theme.colors.primary,
    };

    // SuperAdmin
    if (user?.role === "superadmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: t("menu.tasks"),
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: t("menu.shifts"),
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        toolsItem,
        {
          id: "projects",
          screen: "Projects",
          title: t("menu.projects"),
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
        planningItem,
      ];
    }

    // CompanyAdmin
    if (user?.role === "companyAdmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: t("menu.tasks"),
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: t("menu.shifts"),
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        toolsItem,
        {
          id: "projects",
          screen: "Projects",
          title: t("menu.projects"),
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
        planningItem,
      ];
    }

    // ProjectAdmin
    if (user?.role === "projectAdmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: t("menu.tasks"),
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: t("menu.shifts"),
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        {
          id: "projects",
          screen: "Projects",
          title: t("menu.projects"),
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        toolsItem,
        planningItem,
      ];
    }

    // Worker — only screens they can actually open
    return [
      ...baseItems,
      {
        id: "projects",
        screen: "Projects",
        title: t("menu.projects"),
        icon: require("../../assets/Projekts.png"),
        color: theme.colors.primary,
      },
      toolsItem,
      {
        id: "tasks",
        screen: "Tasks",
        title: t("menu.tasks"),
        icon: require("../../assets/Tasks.png"),
        color: theme.colors.primary,
      },
      {
        id: "workShifts",
        screen: "Shifts",
        title: t("menu.workShifts"),
        icon: require("../../assets/WorkShifts.png"),
        color: theme.colors.primary,
      },
    ];
  }, [theme.colors.primary, user?.role, t]);

  const settingsItems = [
    {
      id: "language",
      screen: "Language",
      title: t("menu.language"),
      icon: require("../../assets/About.png"),
      color: theme.colors.primary,
    },
    {
      id: "legal",
      screen: "LegalPolicies",
      title: t("menu.legal"),
      icon: require("../../assets/Legal.png"),
      color: theme.colors.primary,
    },
    {
      id: "help",
      screen: "HelpSupport",
      title: t("menu.help"),
      icon: require("../../assets/Help.png"),
      color: theme.colors.primary,
    },
    {
      id: "reportBug",
      screen: "ReportBug",
      title: t("menu.reportBug"),
      icon: require("../../assets/Help.png"),
      color: theme.colors.primary,
    },
    {
      id: "about",
      screen: "AboutApp",
      title: t("menu.about"),
      icon: require("../../assets/About.png"),
      color: theme.colors.primary,
    },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgb(253 253 253)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../assets/Arrow-left.png")}
        />

        {/* TITLE */}
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily["semiBold"] },
          ]}
        >
          {t("menu.title")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* AVATAR SECTION*/}
      {user && (
        <View style={styles.userInfoContainer}>
          {/* PHOTO */}
          <Image
            style={styles.userAvatar}
            source={
              avatarSource
                ? { uri: avatarSource }
                : require("../../assets/Avatar.png")
            }
          />

          {/* NAME */}
          <View style={styles.userInfo}>
            <Text
              style={[
                styles.userName,
                { fontFamily: theme.text.fontFamily["bold"] },
              ]}
            >
              {user.name || t("menu.userFallback")}
            </Text>
          </View>
          
          {/* BADGE */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === "superadmin"
                ? t("roles.superadmin")
                : user.role === "companyAdmin"
                  ? t("roles.companyAdmin")
                  : user.role === "projectAdmin"
                    ? t("roles.projectAdmin")
                    : user.role === "worker"
                      ? t("roles.worker")
                      : t("roles.user")}
            </Text>
          </View>
        </View>
      )}

      {/* MAIN */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuSection}>
          <View style={styles.groupCard}>
            {menuItems.map((item, index) => (
              <MenuButton
                key={item.id}
                screen={item.screen ? item.screen : "Menu"}
                title={item.title}
                color={item.color}
                icon={item.icon}
                isLast={index === menuItems.length - 1}
              />
            ))}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.groupCard}>
            {settingsItems.map((item, index) => (
              <MenuButton
                key={item.id}
                screen={item.screen ? item.screen : "Menu"}
                title={item.title}
                color={item.color}
                icon={item.icon}
                isLast={index === settingsItems.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onActionPress={logout}
        renderActionContent={() => (
          <Text style={styles.logoutButtonText}>{t("menu.logOut")}</Text>
        )}
      />
    </View>
  );
}
