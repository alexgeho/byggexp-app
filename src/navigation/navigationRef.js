import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export const isNavigationReady = () => navigationRef.isReady();

export const navigate = (name, params) => {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.navigate(name, params);
  return true;
};

// DEV only: `xcrun simctl openurl booted "byggexp://dev-nav/<Screen>?json=<params>"`
// opens any screen directly — used to screenshot screens without tapping
// through the app. Never registered in release builds.
if (__DEV__) {
  const { Linking } = require("react-native");
  const handle = ({ url }) => {
    const m = /dev-nav\/([^?]+)(?:\?json=(.*))?$/.exec(url || "");
    if (!m) return;
    let params;
    try {
      params = m[2] ? JSON.parse(decodeURIComponent(m[2])) : undefined;
    } catch {
      params = undefined;
    }
    navigate(m[1], params);
  };
  Linking.addEventListener("url", handle);
}
