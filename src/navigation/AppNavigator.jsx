import React, { useContext } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoaderScreen from "../screens/LoaderScreen";
import AuthNavigator from "./AuthNavigator";
import CameraScreen from "../screens/Main/Camera/CameraScreen";
import ChatListScreen from "../screens/Main/Chat/ChatListScreen";
import TasksScreen from "../screens/Main/TasksScreen";
import ProjectsScreen from "../screens/Main/Project/ProjectsScreen";
import ShiftsScreen from "../screens/Main/Shifts/ShiftsScreen";
import LocationConsentScreen from "../screens/Main/Shifts/LocationConsentScreen";
import ScheduleScreen from "../screens/Main/Schedule/ScheduleScreen";
import MenuScreen from "../screens/Menu/MenuScreen";
import CreateProjectScreen from "../screens/Main/Project/CreateProjectScreen";
import CreateTaskScreen from "../screens/Main/Project/CreateTaskScreen";
import TaskScreen from "../screens/Main/Project/TaskScreen";
import { MyAccount } from "../screens/Menu/MyAccount";
import GroupChatScreen from "../screens/Main/Chat/GroupChatScreen";
import DocumentPreviewScreen from "../screens/Main/DocumentPreviewScreen";
import { ProjectScreen } from "../screens/Main/Project/ProjectScreen";
import { SelectWorkers } from "../screens/Main/Project/SelectWorkers";
import { SelectAdmin } from "../screens/Main/Project/SelectAdmin";
import SingleChatScreen from "../screens/Main/Chat/SingleChatScreen";
import ChatProfileScreen from "../screens/Main/Chat/ChatProfileScreen";
import AuthContext from "../contexts/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { navigationRef } from "./navigationRef";
import { flushPendingNotificationNavigation } from "../services/notifications.service";

import ThemeHomeScreen from "../screens/Main/HomeVariants/ThemeHomeScreen";

import CustomizeHomeScreen from "../screens/Menu/CustomizeHomeScreen";
import LanguageScreen from "../screens/Menu/LanguageScreen";
import AboutAppScreen from "../screens/Menu/AboutAppScreen";
import HelpSupportScreen from "../screens/Menu/HelpSupportScreen";
import HelpGuideScreen from "../screens/Menu/HelpGuideScreen";
import ReportBugScreen from "../screens/Menu/ReportBugScreen";
import LegalPoliciesScreen from "../screens/Menu/LegalPoliciesScreen";
import NotificationsSettingsScreen from "../screens/Menu/NotificationsSettingsScreen";
import DocumentsScreen from "../screens/Menu/DocumentsScreen";
import EmployeesScreen from "../screens/Menu/EmployeesScreen";
import CreateEmployeeScreen from "../screens/Menu/CreateEmployeeScreen";
import EmployeeProfileScreen from "../screens/Menu/EmployeeProfileScreen";
import ToolsScreen from "../screens/Menu/ToolsScreen";
import CreateToolScreen from "../screens/Menu/CreateToolScreen";
import ToolScanScreen from "../screens/Menu/ToolScanScreen";
import EconomyScreen from "../screens/Menu/Economy/EconomyScreen";
import CreateOfferScreen from "../screens/Menu/Economy/CreateOfferScreen";
import CreateInvoiceScreen from "../screens/Menu/Economy/CreateInvoiceScreen";
import {
  canCreateProjects as checkCanCreateProjects,
  canCreateTasks as checkCanCreateTasks,
  canManageTools as checkCanManageTools,
  canManageWorkers as checkCanManageWorkers,
  canManageEmployees as checkCanManageEmployees,
} from "../utils/userRoles";

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
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Chats" component={ChatListScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} />
            <Stack.Screen name="SingleChat" component={SingleChatScreen} />
            <Stack.Screen name="ChatProfile" component={ChatProfileScreen} />
            <Stack.Screen
              name="DocumentPreview"
              component={DocumentPreviewScreen}
            />
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="Task" component={TaskScreen} />
            <Stack.Screen
              name="CustomizeHomeScreen"
              component={CustomizeHomeScreen}
            />
            <Stack.Screen
              name="CreateProject"
              component={CreateProjectScreen}
              options={{ gestureEnabled: canCreateProjects }}
            />
            <Stack.Screen
              name="CreateTask"
              component={CreateTaskScreen}
              options={{ gestureEnabled: canCreateTasks }}
            />
            <Stack.Screen
              name="SelectWorkers"
              component={SelectWorkers}
              options={{ gestureEnabled: canManageWorkers }}
            />
            <Stack.Screen
              name="SelectAdmin"
              component={SelectAdmin}
              options={{ gestureEnabled: isCompanyAdmin }}
            />
            <Stack.Screen name="Shifts" component={ShiftsScreen} />
            <Stack.Screen
              name="LocationConsent"
              component={LocationConsentScreen}
              options={{ presentation: "modal" }}
            />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="MyAccount" component={MyAccount} />
            <Stack.Screen
              name="NotificationsSettings"
              component={NotificationsSettingsScreen}
            />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen
              name="Employees"
              component={EmployeesScreen}
              options={{ gestureEnabled: canManageEmployees }}
            />
            <Stack.Screen
              name="CreateEmployee"
              component={CreateEmployeeScreen}
              options={{ gestureEnabled: canManageEmployees }}
            />
            <Stack.Screen name="Employee" component={EmployeeProfileScreen} />
            <Stack.Screen name="Tools" component={ToolsScreen} />
            <Stack.Screen name="ToolScan" component={ToolScanScreen} />
            <Stack.Screen name="Economy" component={EconomyScreen} />
            <Stack.Screen name="CreateOffer" component={CreateOfferScreen} />
            <Stack.Screen
              name="CreateInvoice"
              component={CreateInvoiceScreen}
            />
            <Stack.Screen
              name="CreateTool"
              component={CreateToolScreen}
              options={{ gestureEnabled: canManageTools }}
            />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="HelpGuide" component={HelpGuideScreen} />
            <Stack.Screen name="ReportBug" component={ReportBugScreen} />
            <Stack.Screen
              name="LegalPolicies"
              component={LegalPoliciesScreen}
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
