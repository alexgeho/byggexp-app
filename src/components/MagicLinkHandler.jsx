import { useContext, useEffect, useRef } from "react";
import { DeviceEventEmitter, Linking } from "react-native";
import AuthContext from "../contexts/AuthContext";
import { navigationRef } from "../navigation/navigationRef";
import { openWelcomeTour } from "./common/WelcomeSlides/WelcomeSlides";

// Dev builds only: byggexp://dev/open/<Screen>?id=… jumps straight to a screen
// (lets a simulator be driven without taps). Never active in release builds.
const openDevScreen = (url) => {
  if (!__DEV__ || !url) return false;
  if (url.includes("dev/tour-next")) {
    DeviceEventEmitter.emit("welcome:dev-next");
    return true;
  }
  if (url.includes("dev/tour")) {
    openWelcomeTour();
    return true;
  }
  const m = url.match(/dev\/open\/([A-Za-z]+)(?:\?id=([^&]+))?/);
  if (!m || !navigationRef.isReady()) return false;
  navigationRef.navigate(
    m[1],
    m[2] ? { id: decodeURIComponent(m[2]) } : undefined,
  );
  return true;
};

const extractMagicCode = (url) => {
  // Custom scheme (byggexp://auth/magic?code=…) or Universal/App Link
  // (https://api.byggexp.se/app/magic?code=…) delivered to the app.
  if (!url || !(url.includes("auth/magic") || url.includes("app/magic"))) {
    return null;
  }

  const match = url.match(/[?&]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function MagicLinkHandler() {
  const { magicLogin } = useContext(AuthContext);
  // A cold open via a link can deliver the same URL to BOTH getInitialURL() and
  // the "url" listener — processing it twice runs magicLogin twice, and the
  // second call fails on the now-consumed code, flip-flopping auth (the loader
  // "flashes"). Process each code at most once.
  const handledCodesRef = useRef(new Set());

  useEffect(() => {
    const handleUrl = async (url) => {
      if (openDevScreen(url)) return;
      const code = extractMagicCode(url);

      if (!code || handledCodesRef.current.has(code)) {
        return;
      }
      handledCodesRef.current.add(code);

      await magicLogin(code);
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleUrl(url);
        }
      })
      .catch((error) => {
        console.error("Failed to read initial magic link:", error);
      });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [magicLogin]);

  return null;
}
