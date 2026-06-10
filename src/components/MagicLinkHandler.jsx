import { useContext, useEffect } from "react";
import { Linking } from "react-native";
import AuthContext from "../contexts/AuthContext";

const extractMagicCode = (url) => {
  if (!url || !url.includes("auth/magic")) {
    return null;
  }

  const match = url.match(/[?&]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export default function MagicLinkHandler() {
  const { magicLogin } = useContext(AuthContext);

  useEffect(() => {
    const handleUrl = async (url) => {
      const code = extractMagicCode(url);

      if (!code) {
        return;
      }

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
