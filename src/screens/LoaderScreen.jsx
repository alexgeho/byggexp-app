import React, { useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import AuthContext from '../contexts/AuthContext';
import { baseColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export default function LoaderScreen() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const { theme } = useTheme();

  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });

    textOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    const timer = setTimeout(() => {
      setIsAuthenticated(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.logoText,
          { fontFamily: theme.text.fontFamily['bold'] },
          logoAnimatedStyle,
        ]}
      >
        BYGGEXP
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          { fontFamily: theme.text.fontFamily['regular'] },
          textAnimatedStyle,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    color: baseColors.text.description,
    marginTop: 10,
  },
});

