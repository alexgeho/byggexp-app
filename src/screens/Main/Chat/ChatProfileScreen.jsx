import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";
import { shiftService } from "../../../services";
import { formatShiftDayLabel, resolveUploadUrl } from "../../../utils/shifts";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

const PHOTO_GAP = 10;
const PHOTO_THUMB = Math.floor(
  (Dimensions.get("window").width - 12 * 2 - PHOTO_GAP * 2) / 3,
);

const getId = (entity) => entity?._id || entity?.id;

const getInitials = (name) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

export default function ChatProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const person = route.params?.person || {};
  const personId = getId(person);
  const isAdmin = ["companyAdmin", "superadmin", "projectAdmin"].includes(
    user?.role,
  );

  const [photoSections, setPhotoSections] = useState([]);

  const loadRecentPhotos = useCallback(async () => {
    if (!personId) {
      return;
    }
    try {
      const data = await shiftService.list({ workerId: personId });
      const sections = (data?.days || [])
        .map((day) => ({
          date: day.date,
          photos: (day.shifts || []).flatMap((shift) => shift.photos || []),
        }))
        .filter((day) => day.photos.length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      setPhotoSections(sections);
    } catch (error) {
      console.error("Failed to load profile photos:", error);
    }
  }, [personId]);

  useEffect(() => {
    loadRecentPhotos();
  }, [loadRecentPhotos]);

  const avatarUri = person.avatarUrl
    ? resolveUploadUrl(person.avatarUrl)
    : null;
  const phone =
    person.phoneAreaCode && person.phoneNumber
      ? `+${person.phoneAreaCode} ${person.phoneNumber}`
      : person.phoneNumber || null;
  const companyName =
    person.company?.name || person.companyName || person.company || null;
  const roleLabel = person.role
    ? t(`roles.${person.role}`, { defaultValue: person.role })
    : null;

  const fields = [
    { key: "email", label: t("profile.email"), value: person.email },
    { key: "role", label: t("profile.role"), value: roleLabel },
    {
      key: "profession",
      label: t("profile.professionalRole"),
      value: person.profession,
    },
    { key: "phone", label: t("profile.mobilePhone"), value: phone },
    { key: "company", label: t("profile.company"), value: companyName },
  ].filter((field) => field.value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor="rgba(255, 255, 255, 0.6)"
          tint="light"
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {t("profile.title")}
        </Text>
        {isAdmin && personId ? (
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("Employee", { employeeId: personId })
            }
          >
            <Icon name="edit-2" size={18} color="#0785F4" />
          </TouchableOpacity>
        ) : (
          <View style={styles.editButton} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>
                {getInitials(person.name)}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.name,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {person.name || t("employees.unnamed")}
          </Text>
          {person.profession ? (
            <Text style={styles.subtitle}>{person.profession}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          {fields.map((field, index) => (
            <View
              key={field.key}
              style={[styles.field, index > 0 && styles.fieldSpacing]}
            >
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text
                style={[
                  styles.fieldValue,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {field.value}
              </Text>
            </View>
          ))}
        </View>

        {photoSections.map((section) => (
          <View key={section.date} style={styles.photosBlock}>
            <View style={styles.photosHeader}>
              <Text style={styles.photosDate}>
                {formatShiftDayLabel(section.date)}
              </Text>
              <Text style={styles.photosCount}>
                {t("camera.photoCount", { count: section.photos.length })}
              </Text>
            </View>
            <View style={styles.photoGrid}>
              {section.photos.map((photo, index) => (
                <Image
                  key={`${photo.url}-${index}`}
                  source={{ uri: resolveUploadUrl(photo.url) }}
                  style={styles.photoThumb}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    backgroundColor: "#f2f1f6",
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    flex: 1,
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 150,
  },
  identity: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D9D9D9",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#052D50",
    fontSize: 40,
    fontWeight: "700",
  },
  name: {
    marginTop: 8,
    color: "#052D50",
    fontSize: 22,
  },
  subtitle: {
    color: "#667E93",
    fontSize: 15,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  field: {
    gap: 4,
  },
  fieldSpacing: {
    marginTop: 12,
  },
  fieldLabel: {
    color: "rgba(5, 45, 80, 0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  fieldValue: {
    color: "#052D50",
    fontSize: 17,
    fontWeight: "500",
  },
  photosBlock: {
    marginTop: 20,
    gap: 12,
  },
  photosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photosDate: {
    color: "#667E93",
    fontSize: 13,
    fontWeight: "500",
  },
  photosCount: {
    color: "#667E93",
    fontSize: 13,
    fontWeight: "500",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoThumb: {
    width: PHOTO_THUMB,
    height: PHOTO_THUMB,
    borderRadius: 6,
    backgroundColor: "#D9D9D9",
  },
});
