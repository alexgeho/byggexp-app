import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { checklistService, projectService } from "../../services";
import { EntityListScreen } from "../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../components/common/ListCard/ListCard";
import { useCardStyles } from "../../styles/cards";
import { getEntityId } from "../../utils/entityId";
import { isEgenkontrollOnly } from "../../utils/companyModules";
import { shortTitle, titleAddress } from "../../utils/egenkontrollTitle";
import {
  egenkontrollBadgeStyle,
  progressOf,
  unfinishedFirst,
} from "./egenkontrollStatus";
import LoadError from "./LoadError";
import UploadZone from "./UploadZone";

// Egenkontroller list — the same screen and card as "My projects"
// (EntityListScreen + ListCard): title + status pill, blue progress line,
// grey address. For the solo plan it is the home screen (no back button).
export default function EgenkontrollListScreen({ isHome = false }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const empty = !loading && !items.length;

  return (
    <EntityListScreen
      title={t("egenkontroll.title")}
      hideBack={home}
      onNavigateHome={home ? load : undefined}
      data={items}
      loading={loading && !items.length}
      keyExtractor={(item) => getEntityId(item)}
      emptyText={loadError ? undefined : t("egenkontroll.emptyTitle")}
      addScreen="NewEgenkontroll"
      // Empty / error: the upload zone (or retry) is the one action.
      listHeader={
        loadError && !items.length ? (
          <LoadError onRetry={load} />
        ) : empty ? (
          <UploadZone
            onPress={() =>
              navigation.navigate("NewEgenkontroll", { autoPick: true })
            }
          />
        ) : null
      }
      renderCard={(item) => (
        <ListCard
          onPress={() => open(item)}
          title={shortTitle(item.title)}
          badgeLabel={t(`egenkontroll.status.${item.status || "draft"}`)}
          badgeStyle={egenkontrollBadgeStyle(theme.content, item.status)}
        >
          <Text
            style={[
              cardStyles.cardPrimaryText,
              { color: theme.colors.primary },
            ]}
          >
            {t("egenkontroll.pointsDone", progressOf(item))}
          </Text>
          {item.address ? (
            <Text
              style={[
                cardStyles.cardSecondaryText,
                { color: theme.content.textMuted },
              ]}
              numberOfLines={2}
            >
              {item.address}
            </Text>
          ) : null}
        </ListCard>
      )}
    />
  );
}
