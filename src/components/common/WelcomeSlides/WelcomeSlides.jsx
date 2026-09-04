import React, { useContext, useEffect, useRef, useState } from "react";

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
import { SvgXml } from "react-native-svg";
import Icon from "react-native-vector-icons/Feather";

import AuthContext from "../../../contexts/AuthContext";
import { track } from "../../../utils/analytics";
import { ByggExpWordmark } from "../ByggExpWordmark/ByggExpWordmark";
import { valueIllustration } from "./valueIllustrations";
import { createStyles } from "./WelcomeSlides.styles";

// One-time value tour shown right after the FIRST sign-in — not before it,
// because the slides are role-specific and the role only exists once the user is
// authenticated. Workers and admins see a different, short (2-slide) pitch of
// the features that matter to them. Reads its own "seen" flag from AsyncStorage,
// so it renders nothing on every later launch. Pure JS overlay → ships over OTA.
//
// Key is versioned: bumping it re-shows the tour once to everyone (e.g. when the
// content changes), which is why existing users who saw the old generic slides
// get the new role-aware ones a single time.
const SEEN_KEY = "welcome-slides-seen-v3";
const { width } = Dimensions.get("window");

// Post-login value screens. Worker: one strong screen (title + benefit line).
// Admin: two screens — team/projects and finance/invoicing — each with a
// feature list. Copy lives in i18n under welcome.<roleKey>.slide.<key>.*
// (title + text, or title + f1..fN when `features` is set). `illustration` picks
// the vector art in valueIllustrations.js.
const SLIDES_BY_ROLE = {
  worker: [{ key: "1", illustration: "worker" }],
  admin: [
    { key: "1", illustration: "adminTeam", features: 4 },
    { key: "2", illustration: "adminEconomy", features: 4 },
  ],
};

export function WelcomeSlides() {
  const { t } = useTranslation();
  const styles = createStyles();
  const { user } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const startedRef = useRef(false);

  const role = user?.role;
  const roleKey = role === "worker" ? "worker" : "admin";
  const slides = SLIDES_BY_ROLE[roleKey];

  // Only decide to show once we actually know the role (i.e. signed in).
  useEffect(() => {
    let active = true;
    if (!role) {
      setVisible(false);
      return () => {
        active = false;
      };
    }
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
  }, [role]);

  // Fire the "started" + first-slide-viewed events once the tour appears.
  useEffect(() => {
    if (visible && !startedRef.current) {
      startedRef.current = true;
      track("welcome_started", { role: roleKey });
      track("welcome_slide_viewed", { role: roleKey, index: 0 });
    }
  }, [visible, roleKey]);

  if (!visible || !slides) {
    return null;
  }

  const finish = (reason) => {
    AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
    track(reason === "skipped" ? "welcome_skipped" : "welcome_completed", {
      role: roleKey,
      atIndex: index,
    });
    setVisible(false);
  };

  const goNext = () => {
    if (index >= slides.length - 1) {
      finish("completed");
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    setIndex(next);
    track("welcome_slide_viewed", { role: roleKey, index: next });
  };

  const isLast = index === slides.length - 1;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <ByggExpWordmark width={120} color="#FFFFFF" />
        <TouchableOpacity
          onPress={() => finish("skipped")}
          hitSlop={styles.hitSlop}
        >
          <Text style={styles.skip}>{t("welcome.skip", "Hoppa över")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <SvgXml
              xml={valueIllustration(item.illustration)}
              width={240}
              height={180}
              style={styles.illustration}
            />
            <Text style={styles.title}>
              {t(`welcome.${roleKey}.slide.${item.key}.title`)}
            </Text>
            {item.features ? (
              <View style={styles.featureList}>
                {Array.from({ length: item.features }, (_, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={styles.featureBullet}>
                      <Icon name="check" size={13} color="#FFFFFF" />
                    </View>
                    <Text style={styles.featureText}>
                      {t(`welcome.${roleKey}.slide.${item.key}.f${i + 1}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.text}>
                {t(`welcome.${roleKey}.slide.${item.key}.text`)}
              </Text>
            )}
          </View>
        )}
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}

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
