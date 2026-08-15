import React, { useEffect, useContext, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import AuthContext from "../contexts/AuthContext";
import { baseColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import logoByggexp from "../assets/logo-byggexp.png";

export default function LoaderScreen() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const { theme } = useTheme();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    const timer = setTimeout(() => {
      setIsAuthenticated(false);
    }, 10000);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [logoOpacity, setIsAuthenticated, textOpacity]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={logoByggexp}
        resizeMode="contain"
        style={[styles.logoImage, { opacity: logoOpacity }]}
      />
      <Animated.Text
        style={[
          styles.subtitle,
          {
            fontFamily: theme.text.fontFamily["regular"],
            opacity: textOpacity,
          },
        ]}
      >
        Construction management software
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoImage: {
    width: 220,
    height: 30,
    marginBottom: 10,
  },
  subtitle: {
    color: baseColors.text.description,
    marginTop: 10,
  },
});
