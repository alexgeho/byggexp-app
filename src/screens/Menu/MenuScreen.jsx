import React, { useContext, useMemo, useState, useCallback } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeContext";
import { MenuButton } from "../../components/common/MenuButton/MenuButton";
import AuthContext from "../../contexts/AuthContext";
import { userService } from "../../services";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { createStyles } from "./MenuScreen.styles";
import { resolveUploadUrl } from "../../utils/shifts";

export default function MenuScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user, logout, hasPermission } = useContext(AuthContext);
  // The persisted AuthContext `user` (from login / getInfo) may not carry an
  // avatarUrl, so the header would fall back to the placeholder even when the
  // account has a real photo. Fetch the full profile on focus — like MyAccount —
  // and prefer its avatarUrl, falling back to the context user.
  const profileId = user?._id || user?.id || null;
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!profileId) {
        return;
      }

      let active = true;
      userService
        .getById(profileId)
        .then((profile) => {
          if (active) {
            setProfileAvatarUrl(profile?.avatarUrl ?? null);
          }
        })
        .catch((error) => {
          console.error("MenuScreen: Failed to load profile avatar:", error);
        });

      return () => {
        active = false;
      };
    }, [profileId]),
  );

  const avatarSource = resolveUploadUrl(profileAvatarUrl || user?.avatarUrl);
  // Economy/invoicing is gated on the finance.manage capability, so a delegated
  // "office" user sees it even without an admin role.
  const canFinance = hasPermission("finance.manage");

  const menuItems = useMemo(() => {
    const baseItems = [
      {
        id: "customizeHome",
        // Open Home and slide the customize drawer in over it, so theme /
        // layout changes preview live on the visible part of the home screen.
        screen: "Main",
        params: { openCustomize: true },
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
      {
        id: "chats",
        screen: "Chats",
        title: t("menu.chats", "Chats"),
        icon: require("../../assets/mainButtons/messager.png"),
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

    // TODO: swap for a dedicated economy/invoice icon when available.
    const economyItem = {
      id: "economy",
      screen: "Economy",
      title: t("menu.economy"),
      icon: require("../../assets/Documents.png"),
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
        ...(canFinance ? [economyItem] : []),
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
        ...(canFinance ? [economyItem] : []),
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
        ...(canFinance ? [economyItem] : []),
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
      ...(canFinance ? [economyItem] : []),
    ];
  }, [theme.colors.primary, user?.role, t, canFinance]);

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
      id: "guide",
      screen: "HelpGuide",
      title: t("menu.guide"),
      icon: require("../../assets/Help.png"),
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

  // Settings groups the personal + app-configuration entries: My account,
  // Documents, Customize screens, Language and Notifications.
  const settingsSectionItems = [
    ...menuItems.filter((item) => item.id === "account"),
    ...menuItems.filter((item) => item.id === "documents"),
    ...menuItems.filter((item) => item.id === "customizeHome"),
    ...settingsItems.filter((item) => item.id === "language"),
    ...menuItems.filter((item) => item.id === "notifications"),
  ];

  // Group the flat menu items into labelled categories.
  // Order: Settings, Work (incl. Finance), Information, Support (Support last).
  const menuSections = [
    {
      id: "settings",
      title: t("menu.sectionSettings"),
      items: settingsSectionItems,
    },
    {
      id: "work",
      title: t("menu.sectionWork"),
      items: menuItems.filter((item) =>
        [
          "chats",
          "tasks",
          "shifts",
          "workShifts",
          "employees",
          "tools",
          "projects",
          "planning",
          "economy",
        ].includes(item.id),
      ),
    },
    {
      id: "information",
      title: t("menu.sectionInformation", "Information"),
      items: settingsItems.filter((item) =>
        ["legal", "about"].includes(item.id),
      ),
    },
    {
      id: "support",
      title: t("menu.sectionSupport", "Support"),
      items: settingsItems.filter((item) =>
        ["guide", "help", "reportBug"].includes(item.id),
      ),
    },
  ].filter((section) => section.items.length > 0);

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
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {user.name || t("menu.userFallback")}
            </Text>
          </View>

          {/* BADGE */}
          <View style={styles.roleBadge}>
            <Text
              style={styles.roleText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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
        {menuSections.map((section) => (
          <View key={section.id} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.groupCard}>
              {section.items.map((item, index) => (
                <MenuButton
                  key={item.id}
                  screen={item.screen ? item.screen : "Menu"}
                  params={item.params}
                  title={item.title}
                  color={item.color}
                  icon={item.icon}
                  isLast={index === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onActionPress={logout}
        renderActionContent={() => (
          <Text
            style={styles.logoutButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {t("menu.logOut")}
          </Text>
        )}
      />
    </View>
  );
}
