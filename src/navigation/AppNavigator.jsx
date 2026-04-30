import React, { useContext } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoaderScreen from '../screens/LoaderScreen';
import AuthNavigator from './AuthNavigator';
import MainScreen from '../screens/Main/MainScreen';
import CameraScreen from '../screens/Main/Camera/CameraScreen';
import ChatListScreen from '../screens/Main/Chat/ChatListScreen';
import TasksScreen from '../screens/Main/TasksScreen';
import ProjectsScreen from '../screens/Main/Project/ProjectsScreen';
import HistoryScreen from '../screens/Main/History/HistoryScreen';
import MenuScreen from '../screens/Menu/MenuScreen';
import CreateProjectScreen from '../screens/Main/Project/CreateProjectScreen';
import CreateTaskScreen from '../screens/Main/Project/CreateTaskScreen';
import TaskScreen from '../screens/Main/Project/TaskScreen';
import { MyAccount } from '../screens/Menu/MyAccount';
import GroupChatScreen from '../screens/Main/Chat/GroupChatScreen';
import { ProjectScreen } from '../screens/Main/Project/ProjectScreen';
import { SelectWorkers } from '../screens/Main/Project/SelectWorkers';
import { SelectAdmin } from '../screens/Main/Project/SelectAdmin';
import { ShiftHistory } from '../screens/Main/Project/ShiftHistory';
import SingleChatScreen from '../screens/Main/Chat/SingleChatScreen';
import AuthContext from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { navigationRef } from './navigationRef';
import { flushPendingNotificationNavigation } from '../services/notifications.service';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const { theme } = useTheme();

  if (isLoading) {
    return <LoaderScreen />;
  }

  const canManageProjects = ['superadmin', 'companyAdmin', 'projectAdmin'].includes(user?.role);
  const canManageWorkers = ['companyAdmin', 'projectAdmin'].includes(user?.role);
  const isCompanyAdmin = user?.role === 'companyAdmin';
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
            <Stack.Screen name='Main' component={MainScreen} options={{ headerShown: false }} />
            <Stack.Screen name='Camera' component={CameraScreen} options={{ headerShown: true }} />
            <Stack.Screen name='Chats' component={ChatListScreen} />
            <Stack.Screen name='Tasks' component={TasksScreen} />
            <Stack.Screen name='GroupChat' component={GroupChatScreen} />
            <Stack.Screen name='SingleChat' component={SingleChatScreen} />
            <Stack.Screen name='Projects' component={ProjectsScreen} />
            <Stack.Screen name='Project' component={ProjectScreen} />
            <Stack.Screen name='Task' component={TaskScreen} />
            <Stack.Screen name='ShiftHistory' component={ShiftHistory} />
            <Stack.Screen
              name='CreateProject'
              component={CreateProjectScreen}
              options={{ gestureEnabled: canManageProjects }}
            />
            <Stack.Screen
              name='CreateTask'
              component={CreateTaskScreen}
              options={{ gestureEnabled: canManageProjects }}
            />
            <Stack.Screen
              name='SelectWorkers'
              component={SelectWorkers}
              options={{ gestureEnabled: canManageWorkers }}
            />
            <Stack.Screen
              name='SelectAdmin'
              component={SelectAdmin}
              options={{ gestureEnabled: isCompanyAdmin }}
            />
            <Stack.Screen name='History' component={HistoryScreen} />
            <Stack.Screen name='Menu' component={MenuScreen} />
            <Stack.Screen name='MyAccount' component={MyAccount} />
          </>
        ) : (
          <Stack.Screen name='Auth' component={AuthNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}