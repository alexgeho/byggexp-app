import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { userService, projectService } from "../../../services";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { resolveUploadUrl } from "../../../utils/shifts";
import Icon from "react-native-vector-icons/Feather";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { canManageWorkers } from "../../../utils/userRoles";

export const SelectWorkers = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const { projectId } = route.params || {};

  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const themedCheckboxStyle = {
    borderColor: `${theme.colors.primary}66`,
  };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };

  const allowedToManageWorkers = canManageWorkers(user?.role);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const allWorkers = await userService.getWorkers();
      setWorkers(allWorkers);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkers((prev) => {
      if (prev.includes(workerId)) {
        return prev.filter((id) => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleSaveWorkers = async () => {
    if (!projectId || selectedWorkers.length === 0) return;

    try {
      setSaving(true);
      await projectService.addWorkers(projectId, selectedWorkers);
      showSuccess({
        title: t("workers.added"),
        message: t("workers.addedMessage"),
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error adding workers:", error);
      Alert.alert(t("common.error"), t("workers.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (!allowedToManageWorkers) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.projectName,
              { fontFamily: theme.text.fontFamily["medium"] },
            ]}
          >
            {t("workers.selectTitle")}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
          <Text style={styles.accessDeniedSubtext}>
            {t("access.onlyAdminsManageWorkers")}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text>{t("workers.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.projectName,
            { fontFamily: theme.text.fontFamily["medium"] },
          ]}
        >
          {t("workers.selectTitle")}
        </Text>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Search.png")}
        />
      </View>

      <ScrollView style={{ width: "100%", flex: 1 }}>
        {workers.length === 0 ? (
          <Text style={styles.noWorkersText}>{t("workers.notFound")}</Text>
        ) : (
          workers.map((worker) => (
            <View key={worker._id} style={styles.workerItem}>
              <Image
                style={styles.workerAvatar}
                source={
                  worker.avatarUrl
                    ? { uri: resolveUploadUrl(worker.avatarUrl) }
                    : require("../../../assets/TasksAva.png")
                }
              />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>
                  {worker.name || t("common.noName")}
                </Text>
                <Text style={styles.workerEmail}>{worker.email || ""}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleWorkerSelection(worker._id)}
                style={[
                  styles.checkbox,
                  themedCheckboxStyle,
                  selectedWorkers.includes(worker._id) &&
                    themedCheckboxSelectedStyle,
                ]}
              >
                {selectedWorkers.includes(worker._id) && (
                  <Text style={{ color: "#ffffff" }}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={handleSaveWorkers}
        addDisabled={saving}
        renderAddContent={() =>
          saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="check" size={24} color="#FFFFFF" />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f1f6",
  },
  header: {
    ...standardScreenHeader,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: "#052D50",
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "500",
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 96,
    width: "100%",
  },
  workerItem: {
    width: "100%",
    padding: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    gap: 16,
    marginBottom: 12,
  },
  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 9999,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    color: "#052D50",
  },
  workerEmail: {
    fontSize: 14,
    color: "#698196",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderColor: "#FFFFFF",
    marginRight: 8,
  },
  noWorkersText: {
    textAlign: "center",
    marginTop: 20,
    color: "#698196",
    fontSize: 16,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#052D50",
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: "#698196",
    textAlign: "center",
  },
});
