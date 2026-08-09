import { useContext, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AuthContext from "../contexts/AuthContext";
import { navigate } from "../navigation/navigationRef";
import {
  getBackgroundPermissionStatus,
  isBackgroundGeofencingSupported,
  LOCATION_CONSENT_PROMPTED_KEY,
} from "../utils/backgroundGeofence";

// Offers the background-location consent screen once, shortly after sign-in,
// when the OS dialog can still be raised (permission undetermined) and the user
// hasn't been prompted before. Store compliance: explain before the system ask.
export default function LocationConsentBootstrap() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const handledRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || handledRef.current) {
      return undefined;
    }

    if (!isBackgroundGeofencingSupported()) {
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    let timeoutId = null;

    const maybePrompt = async () => {
      const alreadyPrompted = await AsyncStorage.getItem(
        LOCATION_CONSENT_PROMPTED_KEY,
      ).catch(() => null);
      if (alreadyPrompted) {
        handledRef.current = true;
        return;
      }

      const status = await getBackgroundPermissionStatus().catch(() => null);
      // Only prime when we can still show the OS dialog. If already granted or
      // permanently denied, the screen adds nothing.
      if (status !== "undetermined") {
        handledRef.current = true;
        return;
      }

      // Wait for the navigator to be ready, then show the screen once.
      const tryNavigate = () => {
        if (cancelled || handledRef.current) {
          return;
        }
        if (navigate("LocationConsent")) {
          handledRef.current = true;
          return;
        }
        attempts += 1;
        if (attempts < 20) {
          timeoutId = setTimeout(tryNavigate, 500);
        }
      };

      tryNavigate();
    };

    void maybePrompt();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, isLoading]);

  return null;
}
