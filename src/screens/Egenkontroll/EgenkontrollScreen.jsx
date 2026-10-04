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
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { checklistService } from "../../services";
import { Screen } from "../../components/common/Screen/Screen";
import { FieldCard, FieldRow } from "../../components/common/FieldRow/FieldRow";
import { createStyles as createFieldRowStyles } from "../../components/common/FieldRow/FieldRow.styles";
import { Badge, Button } from "../../components/common/ui";
import { useCardStyles } from "../../styles/cards";
import { layout, space } from "../../theme/spacing";
import { radius } from "../../theme/tokens";
import { resolveUploadUrl } from "../../utils/shifts";
import {
  EgenkontrollProgress,
  EgenkontrollStatusBadge,
  progressOf,
} from "./egenkontrollStatus";

// Collapsed point text length; the rest opens with "läs mer".
const PREVIEW_CHARS = 24;

// Cut at a word boundary so the preview never ends mid-word.
// Leading "Kontrollera (att/vid)" repeats on every AI point — drop it from
// the preview so the collapsed line says what is checked.
const preview = (text) => {
  const core = text.replace(
    /^(kontrollera|kontroll av|check)\s+(att|vid|om|that)?\s*/i,
    "",
  );
  const body = core.charAt(0).toUpperCase() + core.slice(1);
  const cut = body.slice(0, PREVIEW_CHARS);
  const space = cut.lastIndexOf(" ");
  if (body.length <= PREVIEW_CHARS) return body;
  return (space > 10 ? cut.slice(0, space) : cut).trimEnd();
};

const RESULTS = ["ok", "remark", "na"];

const todayIso = () => new Date().toISOString().slice(0, 10);

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
  const { showSuccess } = useFeedback();

  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  // Which action is waiting (photo upload / signing) — its button spins.
  const [pending, setPending] = useState(null);
  // Expanded points (index → true); collapsed rows show one line.
  const [open, setOpen] = useState({});
  const toggleOpen = (i) => setOpen((prev) => ({ ...prev, [i]: !prev[i] }));
  // Typed but unsaved values per point (mätvärde / åtgärd), saved on blur.
  const [edits, setEdits] = useState({});
  const edit = (i, key, value) =>
    setEdits((prev) => ({ ...prev, [i]: { ...prev[i], [key]: value } }));
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

  // Returns the updated egenkontroll (or null on failure).
  const run = async (fn, what = null) => {
    setBusy(true);
    setPending(what);
    try {
      const next = await fn();
      if (next) setDoc(next);
      return next || null;
    } catch (error) {
      console.error("Egenkontroll action failed:", error);
      Alert.alert(t("common.error"), t("egenkontroll.actionFailed"));
      return null;
    } finally {
      setBusy(false);
      setPending(null);
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
    const before = progressOf(doc).done;
    const next = await run(
      () => checklistService.addPhotos(id, photos, meta),
      "photo",
    );
    // Peak: say how many points the photos ticked off.
    const filled = next ? progressOf(next).done - before : 0;
    if (filled > 0) {
      showSuccess({
        title: t("egenkontroll.filledTitle", { count: filled }),
        message: t("egenkontroll.pointsDone", progressOf(next)),
      });
    }
  };

  const saveItem = (index, patch) =>
    run(() =>
      checklistService.update(id, {
        items: doc.items.map((it, i) =>
          i === index ? { ...it, ...patch } : it,
        ),
      }),
    );

  // Vem + datum are filled in from whoever sets the result.
  const setResult = (index, result) =>
    saveItem(index, {
      result,
      date: doc.items[index].date || todayIso(),
      checkedByName: user?.name || doc.items[index].checkedByName || "",
    });

  // Blur → save the typed value if it changed.
  const commit = async (index, key) => {
    const value = edits[index]?.[key];
    if (value === undefined || value === (doc.items[index][key] || "")) return;
    const next = await saveItem(index, { [key]: value.trim() });
    if (next) {
      setEdits((prev) => ({
        ...prev,
        [index]: { ...prev[index], [key]: undefined },
      }));
    }
  };

  // Busy → ignore taps (no double upload/sign), without a pale button.
  const sign = () =>
    busy ||
    Alert.alert(t("egenkontroll.signTitle"), t("egenkontroll.signMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("egenkontroll.sign"),
        onPress: async () => {
          const next = await run(
            () => checklistService.sign(id, user?.name || ""),
            "sign",
          );
          if (next) {
            showSuccess({
              title: t("egenkontroll.status.signed"),
              message: next.title || doc.title,
            });
          }
        },
      },
    ]);

  // One photo action: the app's native source chooser (as in uploadPicker).
  const choosePhotoSource = () =>
    busy ||
    Alert.alert(t("egenkontroll.takePhoto"), undefined, [
      { text: t("egenkontroll.takePhoto"), onPress: () => addPhotos(true) },
      { text: t("egenkontroll.fromLibrary"), onPress: () => addPhotos(false) },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  // Tap a point → the same native chooser for its result.
  const chooseResult = (index) =>
    Alert.alert(`${t("egenkontroll.point")} ${index + 1}`, undefined, [
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
  const progress = progressOf(doc);

  // Expanded point: metod, krav, mätvärde, vem + datum, avvikelse → åtgärd.
  const renderDetails = (it, i) => {
    const value = (key) => edits[i]?.[key] ?? it[key] ?? "";
    const remark = it.result === "remark";
    const answered = it.result && it.result !== "pending";
    const rows = [];
    if (it.method) {
      rows.push({
        key: "m",
        label: t("egenkontroll.method"),
        value: it.method,
      });
    }
    if (it.reference) {
      rows.push({
        key: "r",
        label: t("egenkontroll.requirement"),
        value: it.reference,
      });
    }
    if (!signed || it.measuredValue) {
      rows.push({
        key: "v",
        variant: signed ? "readonly" : "input",
        label: it.unit
          ? `${t("egenkontroll.measured")} (${it.unit})`
          : t("egenkontroll.measured"),
        value: signed
          ? `${it.measuredValue}${it.unit ? ` ${it.unit}` : ""}`
          : value("measuredValue"),
        placeholder: t("egenkontroll.measuredPlaceholder"),
        keyboardType: "decimal-pad",
        onChangeText: (v) => edit(i, "measuredValue", v),
        onEndEditing: () => commit(i, "measuredValue"),
      });
    }
    if (answered && (it.checkedByName || it.date)) {
      rows.push({
        key: "c",
        label: t("egenkontroll.checkedBy"),
        value: [it.checkedByName, it.date].filter(Boolean).join(" · "),
      });
    }
    if (remark && (!signed || it.action)) {
      rows.push({
        key: "a",
        variant: signed || it.actionDoneAt ? "readonly" : "input",
        label: it.actionDoneAt
          ? `${t("egenkontroll.actionDone")} · ${it.actionDoneAt}`
          : t("egenkontroll.action"),
        value: value("action"),
        placeholder: t("egenkontroll.actionPlaceholder"),
        onChangeText: (v) => edit(i, "action", v),
        onEndEditing: () => commit(i, "action"),
      });
    }
    const openDeviation = remark && !it.actionDoneAt;
    return (
      <>
        <View style={rowStyles.sepPlain} />
        {rows.map(({ key, ...row }, k) => (
          <FieldRow
            key={key}
            {...row}
            isLast={k === rows.length - 1 && !openDeviation}
          />
        ))}
        {openDeviation ? (
          <View style={[rowStyles.tapRow, styles.deviation]}>
            <Badge
              label={`• ${t("egenkontroll.openDeviation")}`}
              tone="danger"
            />
            {!signed ? (
              <Button
                size="sm"
                icon="check"
                title={t("egenkontroll.actionDone")}
                loading={pending === `fix${i}`}
                onPress={() =>
                  busy ||
                  run(
                    () =>
                      checklistService.update(id, {
                        items: doc.items.map((p, k) =>
                          k === i
                            ? {
                                ...p,
                                action: (value("action") || "").trim(),
                                actionDoneAt: todayIso(),
                              }
                            : p,
                        ),
                      }),
                    `fix${i}`,
                  )
                }
              />
            ) : null}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <Screen onBack={() => navigation.goBack()}>
      <View style={styles.titleBlock}>
        <Text style={[cardStyles.cardTitle, styles.title]} numberOfLines={2}>
          {doc.title}
        </Text>
        <View style={styles.row}>
          <EgenkontrollStatusBadge status={doc.status} />
          <Text style={cardStyles.cardSecondaryText}>
            {pending === "photo"
              ? t("egenkontroll.analyzing")
              : t("egenkontroll.pointsDone", progress)}
          </Text>
        </View>
        <EgenkontrollProgress item={doc} />
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
                <View style={[rowStyles.tapRow, styles.pointRow]}>
                  {/* Text: tap to expand / collapse the full point. */}
                  <TouchableOpacity
                    style={[rowStyles.body, styles.pointBody]}
                    activeOpacity={0.85}
                    onPress={() => toggleOpen(i)}
                  >
                    <Text style={rowStyles.value}>
                      {open[i] || it.text.length <= PREVIEW_CHARS
                        ? `${i + 1}. ${it.text}`
                        : `${i + 1}. ${preview(it.text)}… `}
                      {!open[i] && it.text.length > PREVIEW_CHARS ? (
                        <Text style={{ color: c.accent }}>
                          {t("egenkontroll.readMore")}
                        </Text>
                      ) : null}
                    </Text>
                    {ai || it.photoUrls?.length ? (
                      <View style={[styles.row, styles.wrap]}>
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
                  </TouchableOpacity>
                  {/* Status: tap to pick the result. */}
                  <TouchableOpacity
                    style={styles.mark}
                    activeOpacity={0.85}
                    disabled={signed || busy}
                    onPress={() => chooseResult(i)}
                    accessibilityLabel={t(
                      `egenkontroll.result.${it.result || "pending"}`,
                    )}
                  >
                    <Icon name={mark.name} size={22} color={mark.color} />
                  </TouchableOpacity>
                </View>
                {open[i] ? renderDetails(it, i) : null}
                {i < points.length - 1 ? (
                  <View style={rowStyles.sepPlain} />
                ) : null}
              </View>
            );
          })}
        </FieldCard>
      </ScrollView>

      {/* Thumb zone: photo + sign side by side at the bottom. */}
      {!signed ? (
        <View style={styles.actions}>
          <Button
            style={styles.flex}
            title={t("egenkontroll.photo")}
            onPress={choosePhotoSource}
            loading={pending === "photo"}
          />
          <Button
            style={styles.flex}
            title={t("egenkontroll.sign")}
            onPress={sign}
            loading={pending === "sign"}
          />
        </View>
      ) : null}
    </Screen>
  );
}

// Layout glue only — colours and shapes come from the shared components.
const styles = StyleSheet.create({
  titleBlock: { gap: space.sm, marginTop: space.xxl, marginBottom: space.xxl },
  // cardTitle is a flex:1 row child; here it sits in a column.
  title: { flex: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  wrap: { flexWrap: "wrap" },
  // 16 above and below the text, 8 between text and its photo/AI row.
  pointRow: { paddingVertical: space.lg, alignItems: "flex-start" },
  pointBody: { gap: space.sm },
  // 44pt tap target around the 22pt status circle.
  mark: {
    width: 44,
    height: 44,
    marginVertical: -11,
    marginRight: -11,
    marginLeft: space.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: space.sm },
  flex: { flex: 1 },
  thumb: { width: 32, height: 32, borderRadius: radius.sm },
  deviation: { gap: space.sm },
});
