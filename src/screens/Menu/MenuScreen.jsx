import React, { useContext, useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user, logout } = useContext(AuthContext);
  const avatarSource = resolveImageUrl(user?.avatarUrl);

  const menuItems = useMemo(() => {
    const baseItems = [
      {
        id: "customizeHome",
        screen: "CustomizeHomeScreen",
        title: "Customize Home Screen",
        icon: require("../../assets/Home.png"),
        color: theme.colors.primary,
      },
      {
        id: "account",
        screen: "MyAccount",
        title: "My account",
        icon: require("../../assets/Account.png"),
        color: theme.colors.primary,
      },
      {
        id: "notifications",
        screen: "NotificationsSettings",
        title: "Notifications",
        icon: require("../../assets/Notifications.png"),
        color: theme.colors.primary,
      },
      {
        id: "documents",
        screen: "Documents",
        title: "Documents",
        icon: require("../../assets/Documents.png"),
        color: theme.colors.primary,
      },
    ];

    const employeesItem = {
      id: "employees",
      screen: "Employees",
      title: "Employees",
      icon: require("../../assets/mainButtons/employees.png"),
      color: theme.colors.primary,
    };

    // SuperAdmin
    if (user?.role === "superadmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: "Tasks",
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: "Shifts",
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        {
          id: "projects",
          screen: "Projects",
          title: "Projects",
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
      ];
    }

    // CompanyAdmin
    if (user?.role === "companyAdmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: "Tasks",
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: "Shifts",
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        {
          id: "company",
          title: "Company",
          icon: require("../../assets/About.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        {
          id: "projects",
          title: "Projects",
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
        {
          id: "finance",
          title: "Finance",
          icon: require("../../assets/Tracker.png"),
          color: theme.colors.primary,
        },
      ];
    }

    // ProjectAdmin
    if (user?.role === "projectAdmin") {
      return [
        ...baseItems,
        {
          id: "tasks",
          screen: "Tasks",
          title: "Tasks",
          icon: require("../../assets/Tasks.png"),
          color: theme.colors.primary,
        },
        {
          id: "shifts",
          screen: "Shifts",
          title: "Shifts",
          icon: require("../../assets/WorkShifts.png"),
          color: theme.colors.primary,
        },
        {
          id: "projects",
          title: "Projects",
          icon: require("../../assets/Projekts.png"),
          color: theme.colors.primary,
        },
        employeesItem,
        {
          id: "reports",
          title: "Reports",
          icon: require("../../assets/Documents.png"),
          color: theme.colors.primary,
        },
      ];
    }

    // Worker
    return [
      ...baseItems,
      {
        id: "tasks",
        screen: "Tasks",
        title: "Tasks",
        icon: require("../../assets/Tasks.png"),
        color: theme.colors.primary,
      },
      {
        id: "workShifts",
        screen: "Shifts",
        title: "Work shifts",
        icon: require("../../assets/WorkShifts.png"),
        color: theme.colors.primary,
      },
    ];
  }, [theme.colors.primary, user?.role]);

  const settingsItems = [
    {
      id: "legal",
      screen: "LegalPolicies",
      title: "Legal & Policies",
      icon: require("../../assets/Legal.png"),
      color: theme.colors.primary,
    },
    {
      id: "help",
      screen: "HelpSupport",
      title: "Help & Support",
      icon: require("../../assets/Help.png"),
      color: theme.colors.primary,
    },
    {
      id: "about",
      screen: "AboutApp",
      title: "About the App",
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
          Menu
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
              {user.name || "User"}
            </Text>
          </View>
          
          {/* BADGE */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === "superadmin"
                ? "Super Admin"
                : user.role === "companyAdmin"
                  ? "Company Admin"
                  : user.role === "projectAdmin"
                    ? "Project Admin"
                    : user.role === "worker"
                      ? "Worker"
                      : "User"}
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
          <Text style={styles.logoutButtonText}>Log out</Text>
        )}
      />
    </View>
  );
}
