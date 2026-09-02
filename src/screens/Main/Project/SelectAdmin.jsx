import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import React, { useContext, useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
import AuthContext from "../../../contexts/AuthContext";
import { useTheme } from "../../../theme/ThemeContext";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { createStyles } from "./SelectAdmin.styles";

export const SelectAdmin = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [isSelected, setSelection] = useState(false);
  const themedCheckboxStyle = {
    borderColor: `${theme.colors.primary}66`,
  };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };

  // Access check - companyAdmin only
  if (user?.role !== "companyAdmin") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton
            backgroundColor={theme.content.surfaceMuted}
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
            {t("admin.selectTitle")}
          </Text>
          <BackButton
            backgroundColor={theme.content.surfaceMuted}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Search.png")}
          />
        </View>
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
          <Text style={styles.accessDeniedSubtext}>
            {t("access.onlyOwnerAssignAdmins")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={theme.content.surfaceMuted}
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
          {t("admin.selectTitle")}
        </Text>
        <BackButton
          backgroundColor={theme.content.surfaceMuted}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Search.png")}
        />
      </View>

      <ScrollView style={{ width: "100%", flex: 1 }}>
        <View style={styles.workerItem}>
          <Image
            style={styles.workerAvatar}
            source={require("../../../assets/TasksAva.png")}
          />
          <Text style={styles.workerName}>{t("admin.sampleWorker")}</Text>
          <TouchableOpacity
            onPress={() => setSelection(!isSelected)}
            style={[
              styles.checkbox,
              themedCheckboxStyle,
              isSelected && themedCheckboxSelectedStyle,
            ]}
          >
            {isSelected && <Text style={{ color: "#ffffff" }}>✓</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={() => navigation.navigate("CreateProject")}
      />
    </View>
  );
};
