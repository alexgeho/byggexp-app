import React, { useContext } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoaderScreen from "../screens/LoaderScreen";
import AuthNavigator from "./AuthNavigator";
import MainScreen from "../screens/Main/MainScreen";
import CameraScreen from "../screens/Main/Camera/CameraScreen";
import ChatListScreen from "../screens/Main/Chat/ChatListScreen";
import TasksScreen from "../screens/Main/TasksScreen";
import ProjectsScreen from "../screens/Main/Project/ProjectsScreen";
import ShiftsScreen from "../screens/Main/Shifts/ShiftsScreen";
import MenuScreen from "../screens/Menu/MenuScreen";
import CreateProjectScreen from "../screens/Main/Project/CreateProjectScreen";
import CreateTaskScreen from "../screens/Main/Project/CreateTaskScreen";
import TaskScreen from "../screens/Main/Project/TaskScreen";
import TaskNotificationsScreen from "../screens/Main/Project/TaskNotificationsScreen";
import TaskNotificationRepeatScreen from "../screens/Main/Project/TaskNotificationRepeatScreen";
import { MyAccount } from "../screens/Menu/MyAccount";
import GroupChatScreen from "../screens/Main/Chat/GroupChatScreen";
import DocumentPreviewScreen from "../screens/Main/DocumentPreviewScreen";
import { ProjectScreen } from "../screens/Main/Project/ProjectScreen";
import { SelectWorkers } from "../screens/Main/Project/SelectWorkers";
import { SelectAdmin } from "../screens/Main/Project/SelectAdmin";
import { ShiftHistory } from "../screens/Main/Project/ShiftHistory";
import SingleChatScreen from "../screens/Main/Chat/SingleChatScreen";
import AuthContext from "../contexts/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { navigationRef } from "./navigationRef";
import { flushPendingNotificationNavigation } from "../services/notifications.service";

import HomeVariant1green from "../screens/Main/HomeVariants/HomeVariant1green";
import HomeVariant2 from "../screens/Main/HomeVariants/HomeVariant2";
import HomeVariant3 from "../screens/Main/HomeVariants/HomeVariant3";
import HomeVariant4darkGray from "../screens/Main/HomeVariants/HomeVariant4darkGray";
import HomeVariant5orange from "../screens/Main/HomeVariants/HomeVariant5orange";
import HomeVariant6blue from "../screens/Main/HomeVariants/HomeVariant6blue";
import ThemeHomeScreen from "../screens/Main/HomeVariants/ThemeHomeScreen";

import CustomizeHomeScreen from "../screens/Menu/CustomizeHomeScreen";
import AboutAppScreen from "../screens/Menu/AboutAppScreen";
import HelpSupportScreen from "../screens/Menu/HelpSupportScreen";
import LegalPoliciesScreen from "../screens/Menu/LegalPoliciesScreen";
import NotificationsSettingsScreen from "../screens/Menu/NotificationsSettingsScreen";
import DocumentsScreen from "../screens/Menu/DocumentsScreen";
import EmployeesScreen from "../screens/Menu/EmployeesScreen";
import CreateEmployeeScreen from "../screens/Menu/CreateEmployeeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { theme } = useTheme();

  if (isLoading) {
    return <LoaderScreen />;
  }

  const canManageProjects = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);
  const canManageWorkers = ["companyAdmin", "projectAdmin"].includes(
    user?.role,
  );
  const isCompanyAdmin = user?.role === "companyAdmin";
  const canManageEmployees = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);
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
              name="HomeVariant1green"
              component={HomeVariant1green}
            />
            <Stack.Screen name="HomeVariant2" component={HomeVariant2} />
            <Stack.Screen name="HomeVariant3" component={HomeVariant3} />
            <Stack.Screen
              name="HomeVariant4darkGray"
              component={HomeVariant4darkGray}
            />
            <Stack.Screen
              name="HomeVariant5orange"
              component={HomeVariant5orange}
            />
            <Stack.Screen
              name="HomeVariant6blue"
              component={HomeVariant6blue}
            />
            <Stack.Screen
              name="Camera"
              component={CameraScreen}
            />
            <Stack.Screen name="Chats" component={ChatListScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} />
            <Stack.Screen name="SingleChat" component={SingleChatScreen} />
            <Stack.Screen name="DocumentPreview" component={DocumentPreviewScreen} />
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
              options={{ gestureEnabled: canManageProjects }}
            />
            <Stack.Screen
              name="CreateTask"
              component={CreateTaskScreen}
              options={{ gestureEnabled: canManageProjects }}
            />
            <Stack.Screen
              name="TaskNotifications"
              component={TaskNotificationsScreen}
              options={{ gestureEnabled: canManageProjects }}
            />
            <Stack.Screen
              name="TaskNotificationRepeat"
              component={TaskNotificationRepeatScreen}
              options={{ gestureEnabled: canManageProjects }}
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
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="LegalPolicies" component={LegalPoliciesScreen} />
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
