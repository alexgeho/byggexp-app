import { useNavigation, useRoute } from "@react-navigation/native";
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
import { standardScreenHeaderSpacing } from "../../../styles/screenLayout";

export const SelectWorkers = () => {
  const navigation = useNavigation();
  const route = useRoute();
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

  // Проверка прав доступа - только для companyAdmin и projectAdmin
  if (!["companyAdmin", "projectAdmin"].includes(user?.role)) {
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
            Select your workers
          </Text>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Search.png")}
          />
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
          <Text style={styles.accessDeniedSubtext}>
            Только администраторы могут управлять работниками
          </Text>
        </View>
      </View>
    );
  }

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
        title: "Workers added",
        message: "Работники добавлены в проект",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error adding workers:", error);
      Alert.alert("Ошибка", "Не удалось добавить работников");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text>Загрузка работников...</Text>
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
          Select your workers
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
          <Text style={styles.noWorkersText}>Работники не найдены</Text>
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
                  {worker.name || "Без имени"}
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

      <View
        style={{
          width: "100%",
          position: "absolute",
          bottom: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        <Image
          style={{ width: "100%", height: 172, transform: "rotate(180deg)" }}
          source={require("../../../assets/ChatBlur.png")}
        />
      </View>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={handleSaveWorkers}
        renderAddContent={() => (
          <Text style={styles.addButtonText}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingTop: 0,
    paddingBottom: 48,
    gap: 24,
    backgroundColor: "#EEEEEE",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...standardScreenHeaderSpacing,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
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
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
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
