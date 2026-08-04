import React, { useCallback, useContext, useEffect, useState } from "react";
import {
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

  const [photoDay, setPhotoDay] = useState(null);

  const loadRecentPhotos = useCallback(async () => {
    if (!personId) {
      return;
    }
    try {
      const data = await shiftService.list({ workerId: personId });
      const dayWithPhotos = (data?.days || [])
        .map((day) => ({
          date: day.date,
          photos: (day.shifts || []).flatMap((shift) => shift.photos || []),
        }))
        .filter((day) => day.photos.length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      setPhotoDay(dayWithPhotos || null);
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
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                {field.value}
              </Text>
            </View>
          ))}
        </View>

        {photoDay ? (
          <View style={styles.photosBlock}>
            <View style={styles.photosHeader}>
              <Text style={styles.photosDate}>
                {formatShiftDayLabel(photoDay.date)}
              </Text>
              <Text style={styles.photosCount}>
                {t("camera.photoCount", { count: photoDay.photos.length })}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosStrip}
            >
              {photoDay.photos.map((photo, index) => (
                <Image
                  key={`${photo.url}-${index}`}
                  source={{ uri: resolveUploadUrl(photo.url) }}
                  style={styles.photoThumb}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
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
    fontSize: 20,
    textAlign: "center",
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF50",
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
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#E5E9ED",
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
    color: "#8296A7",
    fontSize: 14,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 20,
  },
  field: {
    gap: 4,
  },
  fieldSpacing: {
    marginTop: 18,
  },
  fieldLabel: {
    color: "#8296A7",
    fontSize: 13,
  },
  fieldValue: {
    color: "#052D50",
    fontSize: 16,
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
    color: "#052D50",
    fontSize: 15,
    fontWeight: "500",
  },
  photosCount: {
    color: "#8296A7",
    fontSize: 14,
  },
  photosStrip: {
    gap: 10,
    paddingRight: 12,
  },
  photoThumb: {
    width: 120,
    height: 120,
    borderRadius: 14,
    backgroundColor: "#E5E9ED",
  },
});
