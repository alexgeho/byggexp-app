import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';
import { logUserActivity } from './user-activity.service';
import { isNavigationReady, navigate } from '../navigation/navigationRef';

const INSTALLATION_ID_KEY = 'notificationInstallationId';
const EXPO_PUSH_TOKEN_KEY = 'expoPushToken';

let listenersInitialized = false;
let subscriptions = [];
let pendingNotificationNavigation = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = () =>
  Constants?.expoConfig?.extra?.eas?.projectId ??
  Constants?.easConfig?.projectId ??
  null;

const getAppVersion = () =>
  Constants?.expoConfig?.version ??
  Constants?.manifest2?.extra?.expoClient?.version ??
  'unknown';

const safeLogActivity = async (payload) => {
  try {
    await logUserActivity(payload);
  } catch (error) {
    console.warn('Failed to send user activity log:', error);
  }
};

const getInstallationId = async () => {
  const existingId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const installationId = `install-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, installationId);
  return installationId;
};

const buildNavigationTarget = (data = {}) => {
  const screen = data.screen;
  if (!screen) {
    return null;
  }

  if (screen === 'Project') {
    const projectId = data.projectId || data.entityId;
    return projectId ? { screen, params: { id: projectId } } : null;
  }

  return { screen, params: {} };
};

const handleNotificationNavigation = (data = {}) => {
  const target = buildNavigationTarget(data);
  if (!target) {
    return;
  }

  if (!navigate(target.screen, target.params)) {
    pendingNotificationNavigation = target;
  }
};

const handleNotificationResponse = async (response) => {
  const data = response?.notification?.request?.content?.data || {};
  handleNotificationNavigation(data);

  if (Notifications.clearLastNotificationResponseAsync) {
    try {
      await Notifications.clearLastNotificationResponseAsync();
    } catch (error) {
      console.warn('Failed to clear last notification response:', error);
    }
  }
};

export const flushPendingNotificationNavigation = () => {
  if (!pendingNotificationNavigation || !isNavigationReady()) {
    return;
  }

  const { screen, params } = pendingNotificationNavigation;
  pendingNotificationNavigation = null;
  navigate(screen, params);
};

export const initializeNotificationListeners = () => {
  if (listenersInitialized) {
    return () => {};
  }

  listenersInitialized = true;

  subscriptions = [
    Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponse(response);
    }),
  ];

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      void handleNotificationResponse(response);
    }
  });

  return () => {
    subscriptions.forEach((subscription) => subscription.remove());
    subscriptions = [];
    listenersInitialized = false;
  };
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0091FF',
  });
};

const requestPushToken = async () => {
  await ensureAndroidChannel();

  if (!Device.isDevice) {
    return { status: 'unsupported', token: null };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { status: 'denied', token: null };
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Expo projectId is missing. Push notifications require extra.eas.projectId.');
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

  return { status: 'granted', token };
};

export const syncPushTokenForUser = async (user) => {
  const userId = user?.id || user?._id;
  if (!userId) {
    return { status: 'skipped' };
  }

  try {
    const { status, token } = await requestPushToken();
    if (!token) {
      await safeLogActivity({
        category: 'notifications',
        type: `push_token_${status}`,
        level: status === 'denied' ? 'warning' : 'info',
        message:
          status === 'denied'
            ? 'Push notification permission was denied.'
            : status === 'unsupported'
              ? 'Push token sync skipped because the device is unsupported.'
              : 'Push token sync skipped.',
        details: {
          status,
          platform: Platform.OS,
          appVersion: getAppVersion(),
        },
      });
      return { status };
    }

    const installationId = await getInstallationId();
    await api.post('/notifications/push-token', {
      expoPushToken: token,
      installationId,
      platform: Platform.OS,
      appVersion: getAppVersion(),
    });

    await safeLogActivity({
      category: 'notifications',
      type: 'push_token_sync_succeeded',
      level: 'info',
      message: 'Push token synced successfully.',
      details: {
        platform: Platform.OS,
        appVersion: getAppVersion(),
        installationId,
        expoPushToken: token,
      },
    });

    return { status, token };
  } catch (error) {
    await safeLogActivity({
      category: 'notifications',
      type: 'push_token_sync_failed',
      level: 'error',
      message: 'Push token sync failed.',
      details: {
        platform: Platform.OS,
        appVersion: getAppVersion(),
        errorMessage: error?.message || 'Unknown error',
        responseStatus: error?.response?.status || null,
        responseData: error?.response?.data || null,
      },
    });
    throw error;
  }
};

export const unregisterPushToken = async () => {
  const installationId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (!installationId) {
    return;
  }

  try {
    await api.delete(`/notifications/push-token/${encodeURIComponent(installationId)}`);
    await safeLogActivity({
      category: 'notifications',
      type: 'push_token_unregister_succeeded',
      level: 'info',
      message: 'Push token unregistered successfully.',
      details: {
        installationId,
        platform: Platform.OS,
      },
    });
  } catch (error) {
    await safeLogActivity({
      category: 'notifications',
      type: 'push_token_unregister_failed',
      level: error?.response?.status === 404 ? 'warning' : 'error',
      message:
        error?.response?.status === 404
          ? 'Push token unregister skipped because the token was not found.'
          : 'Push token unregister failed.',
      details: {
        installationId,
        platform: Platform.OS,
        errorMessage: error?.message || 'Unknown error',
        responseStatus: error?.response?.status || null,
        responseData: error?.response?.data || null,
      },
    });
    if (error?.response?.status !== 404) {
      throw error;
    }
  }
};

export const getNotificationPreferences = async () => {
  const { data } = await api.get("/notifications/preferences");
  return data;
};

export const updateNotificationPreferences = async (preferences) => {
  const { data } = await api.put("/notifications/preferences", preferences);
  return data;
};

export const notificationsService = {
  initializeNotificationListeners,
  syncPushTokenForUser,
  unregisterPushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  flushPendingNotificationNavigation,
};

export default notificationsService;
