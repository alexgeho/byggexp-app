import { useMemo } from "react";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

export const NOT_AVAILABLE = "N/A";

// App version comes from the native binary (app.json version), the OTA line
// identifies the JS bundle actually running: its channel plus a short update id
// ("embedded" when running the bundle shipped inside the build, i.e. no OTA
// applied). This is how you tell a phone picked up an `eas update` vs still
// running the build's original code.
const APP_VERSION =
  Constants.expoConfig?.version || Constants.manifest?.version || "—";
const OTA_CHANNEL = Updates.channel || "—";
const OTA_UPDATE_ID = Updates.updateId
  ? Updates.updateId.slice(0, 8)
  : "embedded";

// FIXED — the app is made by RealMar AB. This must NEVER be derived from the
// tenant/project company: doing that showed every customer their own company as
// the "developer" with that company's (wrong) contact details.
const APP_DEVELOPER = "RealMar AB";
const APP_CONTACT = "app@byggexp.se / byggexp.se";

export function useAppInformation() {
  const appInfo = useMemo(
    () => ({ developer: APP_DEVELOPER, contact: APP_CONTACT }),
    [],
  );

  const appInformationRows = useMemo(
    () => [
      { key: "version", label: "Version", value: APP_VERSION },
      {
        key: "build",
        label: "Build",
        value: `${OTA_CHANNEL} · ${OTA_UPDATE_ID}`,
      },
      { key: "developer", label: "Developer", value: APP_DEVELOPER },
      { key: "contact", label: "Contact", value: APP_CONTACT },
    ],
    [],
  );

  return {
    appInfo,
    appInformationRows,
    loadingInfo: false,
  };
}
