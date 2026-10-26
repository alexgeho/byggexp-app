import React from "react";
import { Text, Image, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { styles } from "./projectSelector.styles";
import { projectDisplayName } from "../../../utils/internalProject";

export default function ProjectSelector2({
  value,
  onPress,
  style,
  textStyle,
  iconStyle,
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.projectSelector, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        projectDisplayName(value, t) || t("projects.selectOrCreate")
      }
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.projectSelectorText, textStyle]}
      >
        {projectDisplayName(value, t) || t("projects.selectOrCreate")}
      </Text>
      <Image
        source={require("../../../assets/HomeScreen2/arrow-down.png")}
        style={[styles.projectSelectorIcon, iconStyle]}
      />
    </TouchableOpacity>
  );
}
