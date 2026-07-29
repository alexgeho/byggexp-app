import { useContext, useEffect, useRef } from "react";
import AuthContext from "../contexts/AuthContext";
import {
  initializeNotificationListeners,
  syncPushTokenForUser,
} from "../services/notifications.service";

export function NotificationBootstrap() {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const syncedUserRef = useRef(null);

  useEffect(() => {
    const cleanup = initializeNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      syncedUserRef.current = null;
      return;
    }

    const userId = user.id || user._id;
    if (!userId || syncedUserRef.current === userId) {
      return;
    }

    syncedUserRef.current = userId;

    syncPushTokenForUser(user).catch((error) => {
      console.error("Failed to sync push token:", error);
      syncedUserRef.current = null;
    });
  }, [isAuthenticated, isLoading, user]);

  return null;
}

export default NotificationBootstrap;
