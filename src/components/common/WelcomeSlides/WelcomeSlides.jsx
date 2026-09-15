import React, { useContext, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";

import AuthContext from "../../../contexts/AuthContext";
import { track } from "../../../utils/analytics";
import { Mockup } from "./mockups";
import { createStyles } from "./WelcomeSlides.styles";
import { WELCOME_SLIDES_SEEN_KEY } from "../../../utils/onboardingStorage";

// One-time value tour shown right after the FIRST sign-in — not before it,
// because the slides are role-specific and the role only exists once the user is
// authenticated. Admins see a 5-slide pitch, workers a 4-slide one, each a
// single high-fidelity product mockup + one benefit sentence. Reads its own
// "seen" flag from AsyncStorage, so it renders nothing on every later launch.
// Pure JS overlay → ships over OTA.
//
// Key is versioned (onboardingStorage): bumping it re-shows the tour once to
// everyone when the content changes — which is why users who saw the old slides
// get this redesigned set a single time.
const SEEN_KEY = WELCOME_SLIDES_SEEN_KEY;
// Event that any screen can emit to re-open the tour on demand (e.g. from the
// in-app guide) — separate from the one-time auto-show gated by SEEN_KEY.
const OPEN_EVENT = "welcome-slides:open";
const { width } = Dimensions.get("window");

// Soft blue glow behind the product mockup — the Figma "Ellipse 20" (a #4CABFF
// disc at ~14% blurred to ~88px). Reproduced with an SVG radial gradient instead
// of a real blur (same technique the design system already uses for the Home
// card glow in MainButtonsGrid). Absolutely fills the hero area and sits UNDER
// the mockup, so its bright bluish centre reads as a gentle glow and its soft
// falloff as the "darkening" fade the designer applies on the other screens.
const GLOW = "#4CABFF";
function SlideGlow() {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <RadialGradient id="welcomeGlow" cx="50%" cy="50%" rx="72%" ry="30%">
          <Stop offset="0" stopColor={GLOW} stopOpacity="0.16" />
          <Stop offset="0.5" stopColor={GLOW} stopOpacity="0.08" />
          <Stop offset="1" stopColor={GLOW} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#welcomeGlow)" />
    </Svg>
  );
}

// Background colour of the overlay — the mockup dissolves into it at its top and
// bottom edges (the "плавное затемнение" the designer applies on the admin
// slides), so the product screenshot blends softly into the page instead of
// ending on a hard edge.
const BG = "#EEEEEE";
const BG_TRANSPARENT = "rgba(238,238,238,0)";
// Brand blue used for the ghost CTA's label + "next" arrow icon.
const CTA_ACCENT = "#0785F4";

// Soft top+bottom fade over the mockup. Two BG-coloured linear gradients pinned
// to the mockup's own top and bottom edges, opaque at the very edge and clearing
// by ~90px in, so the screenshot melts into the background.
const FADE = { position: "absolute", left: 0, right: 0, height: 44 };
function MockFade() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[BG, BG_TRANSPARENT]}
        style={[FADE, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[BG_TRANSPARENT, BG]}
        style={[FADE, { bottom: 0 }]}
      />
    </>
  );
}

// Re-open the value tour from anywhere (Help guide, etc.). Safe to call before
// the overlay has mounted its listener — the emit is just a no-op then.
export function openWelcomeTour() {
  DeviceEventEmitter.emit(OPEN_EVENT);
}

// Post-login value screens: one product mockup + one benefit sentence (heading
// style) per slide. Copy lives in i18n under welcome.<roleKey>.slide.<key>.title;
// `illustration` picks the rebuilt RN mockup in ./mockups. One slide per page
// for both roles (Figma redesign).
const SLIDES_BY_ROLE = {
  worker: [
    { key: "1", illustration: "workerTime" },
    { key: "2", illustration: "notification" },
    { key: "3", illustration: "documents" },
    { key: "4", illustration: "receipt" },
  ],
  admin: [
    { key: "1", illustration: "arbetspass" },
    { key: "2", illustration: "employees" },
    { key: "3", illustration: "notification" },
    { key: "4", illustration: "receipt" },
    { key: "5", illustration: "costs" },
    { key: "6", illustration: "documents" },
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

  // Manual re-open (from the Help guide): reset to the first slide and show,
  // regardless of the SEEN_KEY flag. Only meaningful once we know the role.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(OPEN_EVENT, () => {
      if (!role) {
        return;
      }
      startedRef.current = false;
      setIndex(0);
      listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      setVisible(true);
    });
    return () => sub.remove();
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

  // Keep dots + CTA label in sync when the user swipes between pages by hand
  // (swiping right also steps back).
  const onScrollEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < slides.length) {
      setIndex(i);
      track("welcome_slide_viewed", { role: roleKey, index: i });
    }
  };

  const isLast = index === slides.length - 1;
  // Light "ghost" CTA on the intermediate admin slides; the final "get started"
  // slide keeps the solid accent pill so it reads as the primary action.
  const ghostCta = roleKey === "admin" && !isLast;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => finish("skipped")}
          hitSlop={styles.hitSlop}
        >
          <Text style={styles.skip}>{t("welcome.skip", "Hoppa över")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item: s }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.heroWrap}>
              {roleKey === "admin" ? <SlideGlow /> : null}
              <View
                style={[
                  styles.mockWrap,
                  roleKey === "admin" && styles.mockWrapAdmin,
                ]}
              >
                <Mockup name={s.illustration} />
                {roleKey === "admin" ? <MockFade /> : null}
              </View>
            </View>
            <Text
              style={[styles.title, roleKey === "admin" && styles.titleAdmin]}
            >
              {t(`welcome.${roleKey}.slide.${s.key}.title`)}
            </Text>
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
        style={[styles.cta, ghostCta && styles.ctaLight]}
        activeOpacity={0.85}
        onPress={goNext}
      >
        <View style={styles.ctaRow}>
          <Text style={[styles.ctaText, ghostCta && styles.ctaTextLight]}>
            {isLast
              ? t("welcome.start", "Kom igång")
              : t("welcome.next", "Nästa")}
          </Text>
          {ghostCta ? (
            <Icon
              name="arrow-right"
              size={18}
              color={CTA_ACCENT}
              style={styles.ctaIcon}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}
