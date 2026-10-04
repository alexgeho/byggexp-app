import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
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
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { useCardStyles } from "../../styles/cards";
import { createStyles as createHomeStyles } from "../Main/HomeVariants/HomeVariant2.styles";
import { createStyles as createPreviewStyles } from "../../components/common/ShiftHistoryPreview/ShiftHistoryPreview.styles";
import { getEntityId } from "../../utils/entityId";
import { isEgenkontrollOnly } from "../../utils/companyModules";
import { EgenkontrollStatusBadge, progressOf } from "./egenkontrollStatus";

// Egenkontroller list. For the solo "Egenkontroll" plan this is the home
// screen: the home gradient, the home preview cards and the home bottom bar.
// Otherwise it is a regular entity list (EntityListScreen + ListCard).
export default function EgenkontrollListScreen({ isHome = false }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme, themeName } = useTheme();
  const cardStyles = useCardStyles();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const home = isHome || isEgenkontrollOnly();

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

  const open = (item) =>
    navigation.navigate("Egenkontroll", { id: getEntityId(item) });

  if (!home) {
    return (
      <EntityListScreen
        title={t("egenkontroll.title")}
        data={items}
        loading={loading}
        keyExtractor={(item) => getEntityId(item)}
        emptyText={t("egenkontroll.emptyTitle")}
        addScreen="NewEgenkontroll"
        renderCard={(item) => (
          <ListCard
            onPress={() => open(item)}
            title={item.title}
            titleNumberOfLines={2}
          >
            <Text style={cardStyles.cardSecondaryText}>
              {t("egenkontroll.pointsDone", progressOf(item))}
            </Text>
            <View style={{ alignSelf: "flex-start" }}>
              <EgenkontrollStatusBadge status={item.status} />
            </View>
          </ListCard>
        )}
      />
    );
  }

  return (
    <HomeList
      items={items}
      loading={loading}
      onOpen={open}
      onReload={load}
      theme={theme}
      themeName={themeName}
    />
  );
}

// Solo home: same container, section header and frosted cards as the home
// screen's previews (ShiftHistoryPreview / TasksPreview).
function HomeList({ items, loading, onOpen, onReload, theme, themeName }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const lightHome = isLightHomeTheme(themeName);
  const dark = themeName === "black";
  const gradient = homeGradientFor(themeName);
  const homeStyles = createHomeStyles({ theme, isLightBlue: lightHome });
  const s = createPreviewStyles(theme, lightHome ? "light" : "dark");

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={homeStyles.container}
    >
      <ScrollView
        style={homeStyles.scrollView}
        contentContainerStyle={[homeStyles.main, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <View style={s.header}>
            <Text style={s.title}>{t("egenkontroll.title")}</Text>
          </View>

          {loading ? (
            <View style={[s.card, { height: undefined }]}>
              <ActivityIndicator color={s.emptyText.color} />
            </View>
          ) : items.length ? (
            items.map((item) => (
              <TouchableOpacity
                key={getEntityId(item)}
                style={[s.card, s.item, { height: undefined }]}
                activeOpacity={0.85}
                onPress={() => onOpen(item)}
              >
                <Text
                  style={[s.durationText, { textAlign: "left" }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={s.metaText}>
                  {t("egenkontroll.pointsDone", progressOf(item))}
                </Text>
                <View style={{ alignSelf: "flex-start" }}>
                  <EgenkontrollStatusBadge status={item.status} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[s.card, s.emptyState]}>
              <Text style={s.emptyText}>{t("egenkontroll.emptyTitle")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomBar
        {...(dark
          ? {
              pillColor: flattenColor(
                theme.colors.homeButtonBackground || theme.colors.card,
                gradient[gradient.length - 1],
              ),
              pillGlowColor: theme.colors.cardGlow,
              pillBorderColor:
                theme.colors.homeButtonBorder &&
                theme.colors.homeButtonBorder !== "transparent"
                  ? theme.colors.homeButtonBorder
                  : theme.colors.border,
            }
          : { glass: true })}
        darkOverride={dark}
        iconColor={dark ? "#FFFFFF" : lightHome ? theme.colors.text : "#052D50"}
        onLeftPress={onReload}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton
        onAddPress={() => navigation.navigate("NewEgenkontroll")}
      />
    </LinearGradient>
  );
}
