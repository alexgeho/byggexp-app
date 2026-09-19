import React, {
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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

// One icon collection for the whole menu (Feather), keyed by item id — replaces
// the mixed PNG glyphs so every row reads as the same set.
const MENU_ICONS = {
  customizeHome: "home",
  account: "user",
  notifications: "bell",
  documents: "file-text",
  chats: "message-circle",
  employees: "user-plus",
  tools: "tool",
  planning: "calendar",
  economy: "dollar-sign",
  tasks: "check-square",
  shifts: "clock",
  workShifts: "clock",
  projects: "folder",
  offers: "file-text",
  invoices: "file",
  clients: "users",
  articles: "package",
  company: "briefcase",
  language: "globe",
  legal: "shield",
  guide: "book-open",
  help: "help-circle",
  reportBug: "alert-triangle",
  about: "info",
};

export default function MenuScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user, logout, hasPermission, updateStoredUser } =
    useContext(AuthContext);
  // The persisted AuthContext `user` (from login / getInfo) may not carry an
  // avatarUrl, so the header would fall back to the placeholder even when the
  // account has a real photo. Fetch the full profile on focus — like MyAccount —
  // and prefer its avatarUrl, falling back to the context user.
  const profileId = user?._id || user?.id || null;
  // Seed from the (persisted) user so the real photo shows immediately on
  // entry instead of flashing the default avatar while the profile loads.
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(
    () => user?.avatarUrl ?? null,
  );

  // Keep the latest user / updater reachable from the focus effect without
  // widening its deps (which would re-fetch on every unrelated user change).
  const userRef = useRef(user);
  userRef.current = user;
  const updateStoredUserRef = useRef(updateStoredUser);
  updateStoredUserRef.current = updateStoredUser;

  useFocusEffect(
    useCallback(() => {
      if (!profileId) {
        return undefined;
      }

      let active = true;
      userService
        .getById(profileId)
        .then((profile) => {
          if (!active) {
            return;
          }
          const nextAvatarUrl = profile?.avatarUrl ?? null;
          setProfileAvatarUrl(nextAvatarUrl);
          // Persist the avatar + job title onto the shared user so they're there
          // instantly on the next entry (and after a cold start) — killing the
          // default-avatar flash for good, and picking up an admin-set profession.
          const nextProfession = (profile?.profession ?? "").trim();
          const avatarChanged =
            nextAvatarUrl && nextAvatarUrl !== userRef.current?.avatarUrl;
          const professionChanged =
            profile?.profession != null &&
            nextProfession !== (userRef.current?.profession ?? "").trim();
          if (avatarChanged || professionChanged) {
            updateStoredUserRef.current?.({
              ...userRef.current,
              ...(avatarChanged ? { avatarUrl: nextAvatarUrl } : {}),
              ...(professionChanged ? { profession: nextProfession } : {}),
            });
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

  // Collapsible categories: the page was one long scroll, so every category
  // except the primary "Projekt & arbete" starts collapsed. Tap a header to
  // expand/collapse.
  const [collapsedSections, setCollapsedSections] = useState({
    economy: true,
    settings: true,
    information: true,
    support: true,
  });
  const toggleSection = useCallback((id) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const avatarSource = resolveUploadUrl(profileAvatarUrl || user?.avatarUrl);
  // Economy/invoicing is gated on the finance.manage capability, so a delegated
  // "office" user sees it even without an admin role.
  const canFinance = hasPermission("finance.manage");

  // Profile badge: show the person's self-authored job title (yrkestitel /
  // `profession`) instead of the bare system role — people identify by their
  // trade, not "Arbetare". If it's unset, admins keep their role label; everyone
  // else gets a tappable invite to add one. Tapping the badge opens an inline
  // editor so anyone can set/change their title (persisted to their profile).
  const professionText = (user?.profession || "").trim();
  const isAdminRole = ["superadmin", "companyAdmin", "projectAdmin"].includes(
    user?.role,
  );
  const roleLabel =
    user?.role === "superadmin"
      ? t("roles.superadmin")
      : user?.role === "companyAdmin"
        ? t("roles.companyAdmin")
        : user?.role === "projectAdmin"
          ? t("roles.projectAdmin")
          : user?.role === "worker"
            ? t("roles.worker")
            : t("roles.user");
  const badgeIsPlaceholder = !professionText && !isAdminRole;
  const badgeText = professionText
    ? professionText
    : isAdminRole
      ? roleLabel
      : t("menu.addTitle");

  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const openTitleEditor = useCallback(() => {
    setTitleDraft((user?.profession || "").trim());
    setTitleModalOpen(true);
  }, [user?.profession]);

  const saveTitle = useCallback(async () => {
    if (!profileId) {
      return;
    }
    const next = titleDraft.trim();
    if (next === (user?.profession || "").trim()) {
      setTitleModalOpen(false);
      return;
    }
    try {
      setSavingTitle(true);
      await userService.update(profileId, { profession: next });
      updateStoredUser?.({ ...user, profession: next });
      setTitleModalOpen(false);
    } catch (error) {
      console.error("MenuScreen: Failed to save job title:", error);
    } finally {
      setSavingTitle(false);
    }
  }, [titleDraft, user, profileId, updateStoredUser]);

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

  // Economy is its own category with the registers surfaced directly (no need to
  // dive into the Economy screen first): offers/invoices open that screen on the
  // right tab, the rest are their own screens. Gated on finance.manage.
  const economySectionItems = [
    {
      id: "offers",
      screen: "Economy",
      params: { mode: "offers" },
      title: t("economy.offers"),
      icon: require("../../assets/Documents.png"),
      color: theme.colors.primary,
    },
    {
      id: "invoices",
      screen: "Economy",
      params: { mode: "invoices" },
      title: t("economy.invoices"),
      icon: require("../../assets/Legal.png"),
      color: theme.colors.primary,
    },
    {
      id: "clients",
      screen: "Clients",
      title: t("clientForm.title"),
      icon: require("../../assets/mainButtons/employees.png"),
      color: theme.colors.primary,
    },
    {
      id: "articles",
      screen: "Articles",
      title: t("articleForm.title"),
      icon: require("../../assets/Tracker.png"),
      color: theme.colors.primary,
    },
    {
      id: "company",
      screen: "CompanyDetails",
      title: t("companyDetails.title"),
      icon: require("../../assets/About.png"),
      color: theme.colors.primary,
    },
  ];

  // Group the flat menu items into labelled, collapsible categories.
  // Order: Projects & work, Economy, Settings, Information, Support.
  const menuSections = [
    {
      id: "projects",
      title: t("menu.sectionProjects", "Projekt & arbete"),
      items: menuItems.filter((item) =>
        [
          "projects",
          "planning",
          "tasks",
          "shifts",
          "workShifts",
          "employees",
          "tools",
          "chats",
        ].includes(item.id),
      ),
    },
    ...(canFinance
      ? [
          {
            id: "economy",
            title: t("menu.economy"),
            items: economySectionItems,
          },
        ]
      : []),
    {
      id: "settings",
      title: t("menu.sectionSettings"),
      items: settingsSectionItems,
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

          {/* BADGE — self-authored job title (tap to edit) */}
          <TouchableOpacity
            style={[
              styles.roleBadge,
              badgeIsPlaceholder && styles.roleBadgePlaceholder,
            ]}
            onPress={openTitleEditor}
            accessibilityRole="button"
            accessibilityLabel={t("menu.editTitle")}
          >
            <Text
              style={[
                styles.roleText,
                badgeIsPlaceholder && styles.roleTextPlaceholder,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {badgeText}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {menuSections.map((section) => {
          const collapsed = !!collapsedSections[section.id];
          return (
            <View key={section.id} style={styles.menuSection}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                activeOpacity={0.7}
                onPress={() => toggleSection(section.id)}
                accessibilityRole="button"
                accessibilityLabel={section.title}
                accessibilityState={{ expanded: !collapsed }}
              >
                <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
                <Image
                  style={styles.sectionChevron}
                  source={
                    collapsed
                      ? require("../../assets/Arrow-right.png")
                      : require("../../assets/Arrow-down.png")
                  }
                  resizeMode="contain"
                />
              </TouchableOpacity>
              {!collapsed && (
                <View style={styles.groupCard}>
                  {section.items.map((item, index) => (
                    <MenuButton
                      key={item.id}
                      screen={item.screen ? item.screen : "Menu"}
                      params={item.params}
                      title={item.title}
                      icon={MENU_ICONS[item.id] || "circle"}
                      isLast={index === section.items.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
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

      {/* Inline job-title (yrkestitel) editor */}
      <Modal
        visible={titleModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTitleModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.titleModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.titleModalBackdrop}
            activeOpacity={1}
            onPress={() => setTitleModalOpen(false)}
          />
          <View style={styles.titleModalCard}>
            <Text style={styles.titleModalTitle}>{t("menu.editTitle")}</Text>
            <Text style={styles.titleModalSubtitle}>
              {t("menu.editTitleHint")}
            </Text>
            <TextInput
              style={styles.titleModalInput}
              value={titleDraft}
              onChangeText={setTitleDraft}
              placeholder={t("menu.titlePlaceholder")}
              placeholderTextColor={theme.content.placeholder}
              maxLength={60}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveTitle}
            />
            <View style={styles.titleModalActions}>
              <TouchableOpacity
                style={[styles.titleModalButton, styles.titleModalCancel]}
                onPress={() => setTitleModalOpen(false)}
                disabled={savingTitle}
              >
                <Text style={styles.titleModalCancelText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleModalButton, styles.titleModalSave]}
                onPress={saveTitle}
                disabled={savingTitle}
              >
                {savingTitle ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.titleModalSaveText}>
                    {t("common.save")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
