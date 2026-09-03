import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { ByggExpWordmark } from "../ByggExpWordmark/ByggExpWordmark";
import { createStyles } from "./WelcomeSlides.styles";

// One-time full-screen intro shown on the very first app launch. Reads its own
// "seen" flag from AsyncStorage, so it renders nothing on every later launch.
// Pure JS overlay → ships over OTA. Mounted at the app root above the navigator.
const SEEN_KEY = "welcome-slides-seen";
const { width } = Dimensions.get("window");

const SLIDES = [
  { key: "1", icon: "briefcase" },
  { key: "2", icon: "clock" },
  { key: "3", icon: "camera" },
];

export function WelcomeSlides() {
  const { t } = useTranslation();
  const styles = createStyles();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (active && seen !== "1") {
          setVisible(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!visible) {
    return null;
  }

  const finish = () => {
    AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
    setVisible(false);
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    setIndex(next);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <ByggExpWordmark size={22} color="#FFFFFF" />
        <TouchableOpacity onPress={finish} hitSlop={styles.hitSlop}>
          <Text style={styles.skip}>{t("welcome.skip", "Hoppa över")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Icon name={item.icon} size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>
              {t(`welcome.slide.${item.key}.title`)}
            </Text>
            <Text style={styles.text}>
              {t(`welcome.slide.${item.key}.text`)}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.cta}
        activeOpacity={0.85}
        onPress={goNext}
      >
        <Text style={styles.ctaText}>
          {isLast
            ? t("welcome.start", "Kom igång")
            : t("welcome.next", "Nästa")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
