import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { checklistService } from "../../services";
import { Screen } from "../../components/common/Screen/Screen";
import { FieldCard } from "../../components/common/FieldRow/FieldRow";
import { createStyles as createFieldRowStyles } from "../../components/common/FieldRow/FieldRow.styles";
import FloatingActionButton from "../../components/common/FloatingActionButton/FloatingActionButton";
import { Badge, Button } from "../../components/common/ui";
import { useCardStyles } from "../../styles/cards";
import { layout, space } from "../../theme/spacing";
import { radius } from "../../theme/tokens";
import { resolveUploadUrl } from "../../utils/shifts";
import { EgenkontrollStatusBadge, progressOf } from "./egenkontrollStatus";

const RESULTS = ["ok", "remark", "na"];

// EXIF "2026:10:04 10:12:00" → ISO; null when absent/unreadable.
const exifDate = (exif) => {
  const raw = exif?.DateTimeOriginal || exif?.DateTime;
  if (!raw) return null;
  const iso = String(raw)
    .replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3")
    .replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// Where the photo was taken: EXIF GPS, else the phone's last known position
// (only if location is already allowed — never prompts here).
const photoPosition = async (exif) => {
  if (
    typeof exif?.GPSLatitude === "number" &&
    typeof exif?.GPSLongitude === "number"
  ) {
    const lat =
      exif.GPSLatitudeRef === "S" ? -exif.GPSLatitude : exif.GPSLatitude;
    const lng =
      exif.GPSLongitudeRef === "W" ? -exif.GPSLongitude : exif.GPSLongitude;
    return { lat, lng };
  }
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return {};
    const pos = await Location.getLastKnownPositionAsync();
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {};
  } catch {
    return {};
  }
};

// One egenkontroll: photos from the site → AI fills the points in (result,
// date, photo); every point can be changed or the AI fill undone; then sign.
export default function EgenkontrollScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.content;
  const cardStyles = useCardStyles();
  const rowStyles = useMemo(() => createFieldRowStyles(c), [c]);
  const { user } = useContext(AuthContext);

  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const id = params?.id;
  const signed = doc?.status === "signed";

  useFocusEffect(
    useCallback(() => {
      checklistService
        .getById(id)
        .then(setDoc)
        .catch(() => setDoc(null));
    }, [id]),
  );

  const run = async (fn) => {
    setBusy(true);
    try {
      const next = await fn();
      if (next) setDoc(next);
    } catch (error) {
      console.error("Egenkontroll action failed:", error);
      Alert.alert(t("common.error"), t("egenkontroll.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  const addPhotos = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const options = { quality: 0.7, exif: true };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({
          ...options,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: 20,
        });
    if (result.canceled || !result.assets?.length) return;
    const assets = result.assets;
    const meta = await Promise.all(
      assets.map(async (a) => ({
        takenAt: exifDate(a.exif) || new Date().toISOString(),
        ...(await photoPosition(a.exif)),
      })),
    );
    const photos = assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName || `foto-${Date.now()}-${i + 1}.jpg`,
      mimeType: a.mimeType || "image/jpeg",
    }));
    await run(() => checklistService.addPhotos(id, photos, meta));
  };

  const setResult = (index, result) =>
    run(() =>
      checklistService.update(id, {
        items: doc.items.map((it, i) =>
          i === index
            ? {
                ...it,
                result,
                date: it.date || new Date().toISOString().slice(0, 10),
              }
            : it,
        ),
      }),
    );

  const sign = () =>
    Alert.alert(t("egenkontroll.signTitle"), t("egenkontroll.signMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("egenkontroll.sign"),
        onPress: () => run(() => checklistService.sign(id, user?.name || "")),
      },
    ]);

  // One photo action: the app's native source chooser (as in uploadPicker).
  const choosePhotoSource = () =>
    Alert.alert(t("egenkontroll.takePhoto"), undefined, [
      { text: t("egenkontroll.takePhoto"), onPress: () => addPhotos(true) },
      { text: t("egenkontroll.fromLibrary"), onPress: () => addPhotos(false) },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  // Tap a point → the same native chooser for its result.
  const chooseResult = (index) =>
    Alert.alert(`${index + 1}. ${doc.items[index].text}`, undefined, [
      ...RESULTS.map((r) => ({
        text: t(`egenkontroll.result.${r}`),
        onPress: () => setResult(index, r),
      })),
      { text: t("common.cancel"), style: "cancel" },
    ]);

  if (!doc) {
    return (
      <Screen onBack={() => navigation.goBack()}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  // Result → one indicator on the right of the row.
  const indicator = (r) =>
    r === "ok"
      ? { name: "check-circle", color: c.success }
      : r === "remark"
        ? { name: "alert-circle", color: c.danger }
        : r === "na"
          ? { name: "minus-circle", color: c.textMuted }
          : { name: "circle", color: c.placeholder };

  const points = doc.items || [];

  return (
    <Screen
      onBack={() => navigation.goBack()}
      right={
        signed ? null : (
          <FloatingActionButton
            onPress={choosePhotoSource}
            disabled={busy}
            accessibilityLabel={t("egenkontroll.takePhoto")}
            renderContent={() =>
              busy ? (
                <ActivityIndicator color={c.onAccent} />
              ) : (
                <Icon name="camera" size={20} color={c.onAccent} />
              )
            }
          />
        )
      }
    >
      <View style={styles.titleBlock}>
        <Text style={[cardStyles.cardTitle, styles.title]} numberOfLines={2}>
          {doc.title}
        </Text>
        <View style={styles.row}>
          <EgenkontrollStatusBadge status={doc.status} />
          <Text style={cardStyles.cardSecondaryText}>
            {busy
              ? t("egenkontroll.analyzing")
              : t("egenkontroll.pointsDone", progressOf(doc))}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: layout.betweenCards }}
        showsVerticalScrollIndicator={false}
      >
        <FieldCard>
          {points.map((it, i) => {
            const sug = it.suggestion;
            const ai = sug && sug.state === "auto" && !signed;
            const mark = indicator(it.result);
            return (
              <View key={i}>
                <TouchableOpacity
                  style={rowStyles.tapRow}
                  activeOpacity={0.85}
                  disabled={signed || busy}
                  onPress={() => chooseResult(i)}
                >
                  <View style={rowStyles.body}>
                    <Text style={rowStyles.value} numberOfLines={2}>
                      {`${i + 1}. ${it.text}`}
                    </Text>
                    {ai || it.photoUrls?.length ? (
                      <View style={[styles.row, styles.meta]}>
                        {it.photoUrls?.map((u) => (
                          <Image
                            key={u}
                            source={{ uri: resolveUploadUrl(u) }}
                            style={[
                              styles.thumb,
                              { backgroundColor: c.inputSurface },
                            ]}
                          />
                        ))}
                        {ai ? (
                          <>
                            <Badge label="AI" tone="accent" />
                            <Text
                              style={[rowStyles.label, { color: c.accent }]}
                              onPress={() =>
                                run(() => checklistService.decide(id, i, false))
                              }
                            >
                              {t("egenkontroll.undo")}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  <Icon name={mark.name} size={22} color={mark.color} />
                </TouchableOpacity>
                {i < points.length - 1 ? (
                  <View style={rowStyles.sepPlain} />
                ) : null}
              </View>
            );
          })}
        </FieldCard>
      </ScrollView>

      {!signed ? (
        <Button title={t("egenkontroll.sign")} onPress={sign} loading={busy} />
      ) : null}
    </Screen>
  );
}

// Layout glue only — colours and shapes come from the shared components.
const styles = StyleSheet.create({
  titleBlock: { gap: space.sm },
  // cardTitle is a flex:1 row child; here it sits in a column.
  title: { flex: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  meta: { marginTop: space.xs },
  flex: { flex: 1 },
  thumb: { width: 32, height: 32, borderRadius: radius.sm },
});
