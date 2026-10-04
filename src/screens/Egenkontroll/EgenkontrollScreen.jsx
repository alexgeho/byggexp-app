import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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
import { BackButton } from "../../components/common/BackButton/BackButton";
import { resolveUploadUrl } from "../../utils/shifts";
import { createStyles, statusColors } from "./Egenkontroll.styles";

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
  const styles = useMemo(() => createStyles(c), [c]);
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

  if (!doc) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const sc = statusColors(c, doc.status);
  const resultLabel = (r) => t(`egenkontroll.result.${r}`);

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
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
            numberOfLines={1}
          >
            {t("egenkontroll.title")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{doc.title}</Text>
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
                {t(`egenkontroll.status.${doc.status || "draft"}`)}
              </Text>
            </View>
          </View>

          {!signed ? (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => addPhotos(true)}
                disabled={busy}
              >
                <Icon name="camera" size={16} color={c.accent} />
                <Text style={styles.secondaryButtonText}>
                  {t("egenkontroll.takePhoto")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => addPhotos(false)}
                disabled={busy}
              >
                <Icon name="image" size={16} color={c.accent} />
                <Text style={styles.secondaryButtonText}>
                  {t("egenkontroll.fromLibrary")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {busy ? (
            <View style={[styles.row, { justifyContent: "center" }]}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.meta}>{t("egenkontroll.analyzing")}</Text>
            </View>
          ) : null}

          {(doc.items || []).map((it, i) => {
            const s = it.suggestion;
            return (
              <View key={i} style={styles.card}>
                <Text style={styles.body}>
                  <Text style={styles.meta}>{i + 1}. </Text>
                  {it.text}
                </Text>

                {s && s.state === "auto" && !signed ? (
                  <View style={[styles.row, { gap: 12 }]}>
                    <Text style={styles.aiTag}>AI</Text>
                    <TouchableOpacity
                      onPress={() =>
                        run(() => checklistService.decide(id, i, false))
                      }
                      disabled={busy}
                    >
                      <Text style={styles.link}>{t("egenkontroll.undo")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={[styles.row, { flexWrap: "wrap", marginTop: 4 }]}>
                  {RESULTS.map((r) => {
                    const active = it.result === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        disabled={signed || busy}
                        onPress={() => setResult(i, r)}
                        style={[
                          styles.chip,
                          active && r === "ok" && styles.chipOk,
                          active && r === "remark" && styles.chipRemark,
                          active &&
                            r === "na" && {
                              borderWidth: 1,
                              borderColor: c.textMuted,
                            },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && r === "ok" && styles.chipOkText,
                            active && r === "remark" && styles.chipRemarkText,
                          ]}
                        >
                          {resultLabel(r)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {it.date ? <Text style={styles.meta}>{it.date}</Text> : null}
                </View>

                {it.photoUrls?.length ? (
                  <View style={[styles.row, { flexWrap: "wrap" }]}>
                    {it.photoUrls.map((u) => (
                      <Image
                        key={u}
                        source={{ uri: resolveUploadUrl(u) }}
                        style={styles.thumb}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {!signed ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={sign}
              disabled={busy}
            >
              <Icon name="edit-3" size={18} color={c.onAccent} />
              <Text style={styles.primaryButtonText}>
                {t("egenkontroll.sign")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}
