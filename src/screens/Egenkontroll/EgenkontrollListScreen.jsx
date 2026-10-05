import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
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
import { checklistService, projectService } from "../../services";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { useCardStyles } from "../../styles/cards";
import { createStyles as createHomeStyles } from "../Main/HomeVariants/HomeVariant2.styles";
import { createStyles as createPreviewStyles } from "../../components/common/ShiftHistoryPreview/ShiftHistoryPreview.styles";
import { createStyles as createButtonStyles } from "../../components/common/NavButtonsGrid/MainButtonsGrid.styles";
import { getEntityId } from "../../utils/entityId";
import { isEgenkontrollOnly } from "../../utils/companyModules";
import { shortTitle, titleAddress } from "../../utils/egenkontrollTitle";
import {
  EgenkontrollProgress,
  EgenkontrollStatusBadge,
  progressOf,
  unfinishedFirst,
} from "./egenkontrollStatus";
import LoadError from "./LoadError";
import UploadZone from "./UploadZone";

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
  const [loadError, setLoadError] = useState(false);
  const home = isHome || isEgenkontrollOnly();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Site address: the part after the dash in the title, else the
      // project's location (solo: typed at create).
      const [data, projects] = await Promise.all([
        checklistService.getAll(),
        projectService.getMyProjects().catch(() => []),
      ]);
      const where = Object.fromEntries(
        (Array.isArray(projects) ? projects : []).map((p) => [
          getEntityId(p),
          p.location || "",
        ]),
      );
      setItems(
        Array.isArray(data)
          ? unfinishedFirst(data).map((it) => ({
              ...it,
              address:
                titleAddress(it.title) || where[String(it.projectId)] || "",
            }))
          : [],
      );
      setLoadError(false);
    } catch (error) {
      console.error("Failed to load egenkontroller:", error);
      setLoadError(true);
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
          <ListCard onPress={() => open(item)} title={shortTitle(item.title)}>
            {item.address ? (
              <Text style={cardStyles.cardSecondaryText} numberOfLines={1}>
                {item.address}
              </Text>
            ) : null}
            <Text style={cardStyles.cardSecondaryText}>
              {t("egenkontroll.pointsDone", progressOf(item))}
            </Text>
            {item.status !== "signed" ? (
              <EgenkontrollProgress item={item} />
            ) : null}
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
      loadError={loadError}
      onOpen={open}
      onReload={load}
      theme={theme}
      themeName={themeName}
    />
  );
}

// Solo home: same container, section header and frosted cards as the home
// screen's previews (ShiftHistoryPreview / TasksPreview).
function HomeList({
  items,
  loading,
  loadError,
  onOpen,
  onReload,
  theme,
  themeName,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const lightHome = isLightHomeTheme(themeName);
  const dark = themeName === "black";
  const gradient = homeGradientFor(themeName);
  const homeStyles = createHomeStyles({ theme, isLightBlue: lightHome });
  const s = createPreviewStyles(theme, lightHome ? "light" : "dark");
  // Cards = the home screen's own grid buttons (fill, border, radius, ink).
  const b = createButtonStyles(theme);
  const ink = b.buttonText.color;

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

          {loading && !items.length ? (
            <View style={[s.card, { height: undefined }]}>
              <ActivityIndicator color={s.emptyText.color} />
            </View>
          ) : loadError && !items.length ? (
            <LoadError onRetry={onReload} textColor={s.durationText.color} />
          ) : items.length ? (
            items.map((item) => (
              <TouchableOpacity
                key={getEntityId(item)}
                style={[b.button, styles.card]}
                activeOpacity={0.85}
                onPress={() => onOpen(item)}
              >
                <View style={[b.buttonInner, styles.cardInner]}>
                  <Text style={b.buttonText} numberOfLines={1}>
                    {shortTitle(item.title)}
                  </Text>
                  {item.address ? (
                    <Text
                      style={[b.buttonText, styles.meta, { color: ink }]}
                      numberOfLines={1}
                    >
                      {item.address}
                    </Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <EgenkontrollStatusBadge status={item.status} />
                    <Text style={[b.buttonText, styles.meta, { color: ink }]}>
                      {t("egenkontroll.pointsDone", progressOf(item))}
                    </Text>
                  </View>
                  {item.status !== "signed" ? (
                    <EgenkontrollProgress item={item} trackColor={`${ink}33`} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            // Empty: the same upload zone as Ny egenkontroll — opens it with
            // the file picker already up.
            <UploadZone
              tint={s.durationText.color}
              surface={s.card.backgroundColor}
              onPress={() =>
                navigation.navigate("NewEgenkontroll", { autoPick: true })
              }
            />
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
        // Empty list: the upload zone is the one action — no second "+".
        showAddButton={!!items.length || loading || !!loadError}
        onAddPress={() => navigation.navigate("NewEgenkontroll")}
      />
    </LinearGradient>
  );
}

// Layout glue: full-width home button used as a list card.
const styles = StyleSheet.create({
  card: { width: "100%", minHeight: undefined },
  cardInner: { alignItems: "stretch", gap: 8 },
  meta: { fontSize: 14, opacity: 0.75 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
