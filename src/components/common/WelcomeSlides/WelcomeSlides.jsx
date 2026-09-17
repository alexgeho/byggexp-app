import React, { useContext, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  DeviceEventEmitter,
  Animated,
  Easing,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
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

// Living-gradient glow behind the product mockup — TWO soft #4CABFF discs (the
// Figma "Ellipse 20" colour) that each wander on their own, à la the bank
// welcome screen. Built from an SVG RadialGradient (colour → transparent) rather
// than a blurred solid: the gradient IS the soft edge, and unlike the SVG
// FeGaussianBlur filter it renders identically on Android (where the filter is
// unsupported and left the discs as hard circles). Ships over OTA.
const GLOW = "#4CABFF";
// Opacity at the centre of each disc; it fades to 0 at the rim via the gradient,
// so the average is much lower. Two overlapping discs stack a little higher.
// Android reads a touch brighter, so it gets a slightly lower value.
const GLOW_ORB_OPACITY = Platform.OS === "android" ? 0.1 : 0.22;
const GLOW_ORB_R_RATIO = 0.4; // orb radius as a fraction of the mockup width
const GLOW_DRIFT_X_RATIO = 0.12; // horizontal wander amplitude (× width)
const GLOW_DRIFT_Y_RATIO = 0.12; // vertical wander amplitude (× height)
// Container fills the mockup; the orbs are positioned absolutely inside it.
// overflow:"hidden" clips the glow to the mockup bounds so the discs never
// spill outside the card as they drift.
const GLOW_BOX = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: "hidden",
};

// One looping 0→1→0 value with a sine ease — a single drift axis. Different
// periods on each axis/orb keep the two glows from ever syncing into a pattern.
function useDrift(period) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: period,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: period,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, period]);
  return v;
}

function GlowOrb({ r, cx, cy, driftX, driftY, ampX, ampY, gradId }) {
  const boxSize = r * 2;
  const translateX = driftX.interpolate({
    inputRange: [0, 1],
    outputRange: [-ampX, ampX],
  });
  const translateY = driftY.interpolate({
    inputRange: [0, 1],
    outputRange: [-ampY, ampY],
  });
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Svg width={boxSize} height={boxSize}>
        <Defs>
          {/* Colour at the centre, fading to fully transparent at the rim — a
              soft glow with no hard edge, cross-platform (no SVG filter). */}
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GLOW} stopOpacity={GLOW_ORB_OPACITY} />
            <Stop
              offset="0.55"
              stopColor={GLOW}
              stopOpacity={GLOW_ORB_OPACITY * 0.45}
            />
            <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={r} cy={r} rx={r} ry={r} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

function SlideGlow() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  // Faster wander than the old single glow; each orb has its own periods.
  const aX = useDrift(2600);
  const aY = useDrift(3400);
  const bX = useDrift(3000);
  const bY = useDrift(2200);
  const r = w * GLOW_ORB_R_RATIO;
  const ampX = w * GLOW_DRIFT_X_RATIO;
  const ampY = h * GLOW_DRIFT_Y_RATIO;
  return (
    <View
      pointerEvents="none"
      onLayout={(e) =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
      style={GLOW_BOX}
    >
      {w > 0 && h > 0 ? (
        <>
          <GlowOrb
            r={r}
            cx={w * 0.3}
            cy={h * 0.44}
            driftX={aX}
            driftY={aY}
            ampX={ampX}
            ampY={ampY}
            gradId="welcomeOrbA"
          />
          <GlowOrb
            r={r}
            cx={w * 0.7}
            cy={h * 0.56}
            driftX={bX}
            driftY={bY}
            ampX={ampX}
            ampY={ampY}
            gradId="welcomeOrbB"
          />
        </>
      ) : null}
    </View>
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

// Soft fade over ALL FOUR edges of the mockup so it melts into the background
// with no hard card border or rounded-corner "stubs" showing. BG-coloured
// gradients pinned to each edge: opaque at the very edge, clearing inward. The
// overlapping corners get covered by two gradients, which dissolves the rounded
// corners too.
const FADE_V = { position: "absolute", left: 0, right: 0, height: 30 };
// Bottom fade — kept modest per the designer ("уменьшите туман"): a gentle
// dissolve of the very bottom edge, not a big white cover.
const FADE_BOTTOM = {
  position: "absolute",
  left: 0,
  right: 0,
  height: 60,
  bottom: -6,
};
// A short solid-bg cap at the very bottom (last ~40%) so the mockup's bottom
// edge still melts cleanly, with a soft gradient above — small footprint, not a
// big white cover.
const FADE_BOTTOM_LOCS = [0, 0.6, 1];
const FADE_H = { position: "absolute", top: 0, bottom: 0, width: 40 };
const H_START = { x: 0, y: 0 };
const H_END = { x: 1, y: 0 };
function MockFade() {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[BG, BG_TRANSPARENT]}
        style={[FADE_V, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[BG_TRANSPARENT, BG, BG]}
        locations={FADE_BOTTOM_LOCS}
        style={FADE_BOTTOM}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[BG, BG_TRANSPARENT]}
        start={H_START}
        end={H_END}
        style={[FADE_H, { left: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[BG_TRANSPARENT, BG]}
        start={H_START}
        end={H_END}
        style={[FADE_H, { right: 0 }]}
      />
    </>
  );
}

// Admin mockup wrapper: the mockup is shrunk 10% with a transform, but a
// transform doesn't shrink the LAYOUT box — leaving a ~5% phantom margin top and
// bottom that either pushed the heading off-centre or opened a gap above the
// illustration. Fix: measure the mockup's natural height, then clamp the wrapper
// to 0.9× that so the box matches the visible (scaled) mockup exactly — no
// phantom. The scaled content (centred) fills the clamped box, so the top/bottom
// fades sit on the real edges and the heading below centres cleanly.
function AdminMock({ name, styles }) {
  const [h, setH] = useState(null);
  return (
    <View style={[styles.mockClip, h != null && { height: h * 0.9 }]}>
      <View
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
        style={styles.mockScale}
      >
        <Mockup name={name} />
        {/* Glow sits IN FRONT of the mockup (subtle, transparent) so it reads
            over the card instead of being hidden behind an opaque screenshot;
            the edge fades stay on top so the card edges still dissolve. */}
        <SlideGlow />
        <MockFade />
      </View>
    </View>
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
  // Light "ghost" CTA on the intermediate slides; the final "get started" slide
  // keeps the solid accent pill so it reads as the primary action. Same for
  // every role.
  const ghostCta = !isLast;

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
        renderItem={({ item: s }) => {
          const heading = t(`welcome.${roleKey}.slide.${s.key}.title`);
          // The mockup sits at the top of the hero area and the heading is centred
          // in the gap below it via equal flex spacers (equal gaps above the
          // mockup, between mockup and heading, and below to the dots). The heading
          // lives INSIDE heroWrap (definite flex:1 height), not sized off the
          // mockup's measured height, so it can never ride up onto a tall mockup.
          // Same treatment for every role (glow / fade / scale / ghost CTA).
          return (
            <View style={[styles.slide, { width }]}>
              <View style={styles.heroWrap}>
                <View style={styles.flexSpacer} />
                <AdminMock name={s.illustration} styles={styles} />
                <View style={styles.flexSpacer} />
                <Text style={[styles.title, styles.titleAdmin]}>{heading}</Text>
                <View style={styles.flexSpacer} />
              </View>
            </View>
          );
        }}
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
