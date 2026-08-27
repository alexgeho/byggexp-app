import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FlatList, Text, View, ActivityIndicator, Alert } from "react-native";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { userService, projectService } from "../../../services";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import Icon from "react-native-vector-icons/Feather";
import { createStyles } from "./SelectWorkers.styles";
import { canManageWorkers } from "../../../utils/userRoles";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";

export const SelectWorkers = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { projectId } = route.params || {};

  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allowedToManageWorkers = canManageWorkers(user?.role);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      // Only role=worker can be added to a project team: the backend's
      // addWorkers endpoint rejects any other role with 403. Managers/admins
      // are assigned through the admin panel, not here.
      const allWorkers = await userService.getWorkers();
      setWorkers(allWorkers || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkerSelection = useCallback((workerId) => {
    setSelectedWorkers((prev) => {
      if (prev.includes(workerId)) {
        return prev.filter((id) => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  }, []);

  const keyExtractor = useCallback((worker) => worker._id, []);

  const renderWorker = useCallback(
    ({ item: worker }) => (
      <PersonListItem
        person={worker}
        subtitle={worker.profession || t("employees.noProfession")}
        statusBadge={getWorkerStatusBadge(worker, projectId, t)}
        selectable
        selected={selectedWorkers.includes(worker._id)}
        onPress={() => toggleWorkerSelection(worker._id)}
      />
    ),
    [selectedWorkers, projectId, t, toggleWorkerSelection],
  );

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

      <FlatList
        style={{ width: "100%", flex: 1 }}
        showsVerticalScrollIndicator={false}
        data={workers}
        keyExtractor={keyExtractor}
        extraData={selectedWorkers}
        ListEmptyComponent={
          <Text style={styles.noWorkersText}>{t("workers.notFound")}</Text>
        }
        renderItem={renderWorker}
      />

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={handleSaveWorkers}
        addDisabled={saving}
        renderAddContent={() =>
          saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="check" size={33} color="#FFFFFF" />
          )
        }
      />
    </View>
  );
};
