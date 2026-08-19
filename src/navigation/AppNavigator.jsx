import React, { useContext } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoaderScreen from "../screens/LoaderScreen";
import AuthNavigator from "./AuthNavigator";
// The first authed screen stays eagerly imported so it's ready at first paint.
import ThemeHomeScreen from "../screens/Main/HomeVariants/ThemeHomeScreen";
import AuthContext from "../contexts/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { navigationRef } from "./navigationRef";
import { flushPendingNotificationNavigation } from "../services/notifications.service";
import {
  canCreateProjects as checkCanCreateProjects,
  canCreateTasks as checkCanCreateTasks,
  canManageTools as checkCanManageTools,
  canManageWorkers as checkCanManageWorkers,
  canManageEmployees as checkCanManageEmployees,
} from "../utils/userRoles";

// Every other screen is loaded via `getComponent` (a deferred require) instead
// of a top-level import, so their modules — and heavy transitive deps
// (expo-camera, webview, charts, economy, all icon sets) — are only evaluated
// on first navigation, not eagerly at cold start. Metro still bundles them
// (static require paths); only evaluation is deferred.

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { theme } = useTheme();

  if (isLoading) {
    return <LoaderScreen />;
  }

  const canCreateProjects = checkCanCreateProjects(user?.role);
  const canCreateTasks = checkCanCreateTasks(user?.role);
  const canManageTools = checkCanManageTools(user?.role);
  const canManageWorkers = checkCanManageWorkers(user?.role);
  const isCompanyAdmin = user?.role === "companyAdmin";
  const canManageEmployees = checkCanManageEmployees(user?.role);
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={flushPendingNotificationNavigation}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="Main"
              component={ThemeHomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Camera"
              getComponent={() =>
                require("../screens/Main/Camera/CameraScreen").default
              }
            />
            <Stack.Screen
              name="Chats"
              getComponent={() =>
                require("../screens/Main/Chat/ChatListScreen").default
              }
            />
            <Stack.Screen
              name="Tasks"
              getComponent={() =>
                require("../screens/Main/TasksScreen").default
              }
            />
            <Stack.Screen
              name="GroupChat"
              getComponent={() =>
                require("../screens/Main/Chat/GroupChatScreen").default
              }
            />
            <Stack.Screen
              name="SingleChat"
              getComponent={() =>
                require("../screens/Main/Chat/SingleChatScreen").default
              }
            />
            <Stack.Screen
              name="ChatProfile"
              getComponent={() =>
                require("../screens/Main/Chat/ChatProfileScreen").default
              }
            />
            <Stack.Screen
              name="DocumentPreview"
              getComponent={() =>
                require("../screens/Main/DocumentPreviewScreen").default
              }
            />
            <Stack.Screen
              name="Projects"
              getComponent={() =>
                require("../screens/Main/Project/ProjectsScreen").default
              }
              // Disable the native-stack transition: selecting a project
              // re-renders Home, and doing that during the close animation
              // raced Fabric on the New Architecture and crashed with "Unable
              // to find viewState for tag" (release-only). No animation → no
              // mid-transition mount race.
              options={{ animation: "none" }}
            />
            <Stack.Screen
              name="Project"
              getComponent={() =>
                require("../screens/Main/Project/ProjectScreen").ProjectScreen
              }
            />
            <Stack.Screen
              name="Task"
              getComponent={() =>
                require("../screens/Main/Project/TaskScreen").default
              }
            />
            <Stack.Screen
              name="CustomizeHomeScreen"
              getComponent={() =>
                require("../screens/Menu/CustomizeHomeScreen").default
              }
            />
            <Stack.Screen
              name="CreateProject"
              getComponent={() =>
                require("../screens/Main/Project/CreateProjectScreen").default
              }
              options={{ gestureEnabled: canCreateProjects }}
            />
            <Stack.Screen
              name="CreateTask"
              getComponent={() =>
                require("../screens/Main/Project/CreateTaskScreen").default
              }
              options={{ gestureEnabled: canCreateTasks }}
            />
            <Stack.Screen
              name="SelectWorkers"
              getComponent={() =>
                require("../screens/Main/Project/SelectWorkers").SelectWorkers
              }
              options={{ gestureEnabled: canManageWorkers }}
            />
            <Stack.Screen
              name="SelectTools"
              getComponent={() =>
                require("../screens/Main/Project/SelectTools").SelectTools
              }
            />
            <Stack.Screen
              name="SelectAdmin"
              getComponent={() =>
                require("../screens/Main/Project/SelectAdmin").SelectAdmin
              }
              options={{ gestureEnabled: isCompanyAdmin }}
            />
            <Stack.Screen
              name="Shifts"
              getComponent={() =>
                require("../screens/Main/Shifts/ShiftsScreen").default
              }
            />
            <Stack.Screen
              name="LocationConsent"
              getComponent={() =>
                require("../screens/Main/Shifts/LocationConsentScreen").default
              }
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="Schedule"
              getComponent={() =>
                require("../screens/Main/Schedule/ScheduleScreen").default
              }
            />
            <Stack.Screen
              name="Menu"
              getComponent={() => require("../screens/Menu/MenuScreen").default}
            />
            <Stack.Screen
              name="MyAccount"
              getComponent={() =>
                require("../screens/Menu/MyAccount").MyAccount
              }
            />
            <Stack.Screen
              name="NotificationsSettings"
              getComponent={() =>
                require("../screens/Menu/NotificationsSettingsScreen").default
              }
            />
            <Stack.Screen
              name="Documents"
              getComponent={() =>
                require("../screens/Menu/DocumentsScreen").default
              }
            />
            <Stack.Screen
              name="Employees"
              getComponent={() =>
                require("../screens/Menu/EmployeesScreen").default
              }
              options={{ gestureEnabled: canManageEmployees }}
            />
            <Stack.Screen
              name="CreateEmployee"
              getComponent={() =>
                require("../screens/Menu/CreateEmployeeScreen").default
              }
              options={{ gestureEnabled: canManageEmployees }}
            />
            <Stack.Screen
              name="Employee"
              getComponent={() =>
                require("../screens/Menu/EmployeeProfileScreen").default
              }
            />
            <Stack.Screen
              name="Tools"
              getComponent={() =>
                require("../screens/Menu/ToolsScreen").default
              }
            />
            <Stack.Screen
              name="ToolScan"
              getComponent={() =>
                require("../screens/Menu/ToolScanScreen").default
              }
            />
            <Stack.Screen
              name="Economy"
              getComponent={() =>
                require("../screens/Menu/Economy/EconomyScreen").default
              }
            />
            <Stack.Screen
              name="CreateOffer"
              getComponent={() =>
                require("../screens/Menu/Economy/CreateOfferScreen").default
              }
            />
            <Stack.Screen
              name="CreateInvoice"
              getComponent={() =>
                require("../screens/Menu/Economy/CreateInvoiceScreen").default
              }
            />
            <Stack.Screen
              name="CreateTool"
              getComponent={() =>
                require("../screens/Menu/CreateToolScreen").default
              }
              options={{ gestureEnabled: canManageTools }}
            />
            <Stack.Screen
              name="Language"
              getComponent={() =>
                require("../screens/Menu/LanguageScreen").default
              }
            />
            <Stack.Screen
              name="AboutApp"
              getComponent={() =>
                require("../screens/Menu/AboutAppScreen").default
              }
            />
            <Stack.Screen
              name="HelpSupport"
              getComponent={() =>
                require("../screens/Menu/HelpSupportScreen").default
              }
            />
            <Stack.Screen
              name="HelpGuide"
              getComponent={() =>
                require("../screens/Menu/HelpGuideScreen").default
              }
            />
            <Stack.Screen
              name="ReportBug"
              getComponent={() =>
                require("../screens/Menu/ReportBugScreen").default
              }
            />
            <Stack.Screen
              name="LegalPolicies"
              getComponent={() =>
                require("../screens/Menu/LegalPoliciesScreen").default
              }
            />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
