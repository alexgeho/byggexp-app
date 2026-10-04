import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { homeGradientFor, isLightHomeTheme } from "../../theme/homeGradient";
import { flattenColor } from "../../theme/colorUtils";
import { checklistService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { getEntityId } from "../../utils/entityId";
import { isEgenkontrollOnly } from "../../utils/companyModules";
import { createStyles, statusColors } from "./Egenkontroll.styles";

// Egenkontroller list. For the solo "Egenkontroll" plan this is the home
// screen and wears the home look: the theme's gradient, glass cards and the
// same bottom bar (home · menu · +), so theme switching works here too.
export default function EgenkontrollListScreen({ isHome = false }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme, themeName } = useTheme();
  const c = theme.content;
  const styles = useMemo(() => createStyles(c), [c]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const home = isHome || isEgenkontrollOnly();

  const gradient = homeGradientFor(themeName);
  const lightHome = isLightHomeTheme(themeName);
  const dark = themeName === "black";
  // Home look: card fill/border/text from the theme's home buttons.
  const fg = home ? theme.colors.homeButtonText || "#FFFFFF" : c.textPrimary;
  const fgMuted = home ? `${fg}B3` : c.textMuted;
  const cardStyle = home
    ? {
        backgroundColor: theme.colors.homeButtonBackground || c.surface,
        borderColor:
          theme.colors.homeButtonBorder &&
          theme.colors.homeButtonBorder !== "transparent"
            ? theme.colors.homeButtonBorder
            : "rgba(255,255,255,0.35)",
      }
    : null;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await checklistService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load egenkontroller:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const content = (
    <View
      style={[styles.pageContainer, home && { backgroundColor: "transparent" }]}
    >
      {home ? (
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: fg,
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          {t("egenkontroll.title")}
        </Text>
      ) : (
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("egenkontroll.title")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={home ? fg : theme.colors.primary}
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => getEntityId(item)}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 48 }]}>
              <Text style={[styles.emptyTitle, { color: fg }]}>
                {t("egenkontroll.emptyTitle")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = item.items?.length || 0;
            const done = (item.items || []).filter(
              (it) => it.result && it.result !== "pending",
            ).length;
            const sc = statusColors(c, item.status);
            return (
              <TouchableOpacity
                style={[styles.card, cardStyle]}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("Egenkontroll", { id: getEntityId(item) })
                }
              >
                <Text
                  style={[styles.cardTitle, { color: fg }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View style={[styles.row, { marginTop: 4 }]}>
                  <View
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: home ? `${fg}33` : c.inputSurface,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${total ? Math.round((done / total) * 100) : 0}%`,
                        height: "100%",
                        backgroundColor: c.success,
                      }}
                    />
                  </View>
                  <Text style={[styles.meta, { color: fgMuted }]}>
                    {done}/{total}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    styles.row,
                    { gap: 6, backgroundColor: sc.bg },
                  ]}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: sc.fg,
                    }}
                  />
                  <Text style={[styles.statusText, { color: sc.fg }]}>
                    {t(`egenkontroll.status.${item.status || "draft"}`)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {home ? (
        // Same bar as the regular home screen.
        <BottomBar
          {...(dark
            ? {
                pillColor: flattenColor(
                  theme.colors.homeButtonBackground || theme.colors.card,
                  gradient[gradient.length - 1],
                ),
                pillGlowColor: theme.colors.cardGlow,
                pillBorderColor:
                  theme.colors.homeButtonBorder || theme.colors.border,
              }
            : { glass: true })}
          darkOverride={dark}
          iconColor={
            dark ? "#FFFFFF" : lightHome ? theme.colors.text : "#052D50"
          }
          onLeftPress={load}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton
          onAddPress={() => navigation.navigate("NewEgenkontroll")}
        />
      ) : (
        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton
          onAddPress={() => navigation.navigate("NewEgenkontroll")}
        />
      )}
    </View>
  );

  return home ? (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.screen}
    >
      {content}
    </LinearGradient>
  ) : (
    <View style={styles.screen}>{content}</View>
  );
}
