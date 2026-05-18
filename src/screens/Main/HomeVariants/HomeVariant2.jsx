import { Text, View, Image, TouchableOpacity } from "react-native";
import React, { useContext } from "react";
import AuthContext from "../../../contexts/AuthContext";
import { styles } from "./HomeVariant2.styles";
import { LinearGradient } from "expo-linear-gradient";

import { useNavigation } from "@react-navigation/native";

import { Timer } from "../../../components/common2/Timer/Timer";
import { Shifts } from "../../../components/common2/ShiftHistory/ShiftHistory";
import { ProjectSelector2 } from "../../../components/common2/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";
import { FooterButtonsVariant2 } from "../../../components/common2/footer/footer";
import ProjectFilesSection from "../../../components/common/ProjectFilesSection/ProjectFilesSection";

export default function HomeVariant2() {
  const { selectedProject } = useContext(AuthContext);
  const navigation = useNavigation();

  function openProjects (){
    navigation.navigate("Projects")
  }

  return (
    <LinearGradient
      colors={["#5BC8FF", "#0D5DB8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* MAIN */}
      <View style={styles.main}>
        {/* PROJECT SELECTOR */}
        <ProjectSelector2 value={selectedProject} onPress={openProjects}  />

        {/* Timer */}
        <Timer />

        {/* MAIN BTN */}
        <MainActionButtons />

        {/* SHIFTS */}
        {/*  <Shifts /> */}

        {/* PROJECT FILES */}
        <ProjectFilesSection project={selectedProject}/>
      </View>

      {/* FOOTER */}
      <FooterButtonsVariant2 />
    </LinearGradient>
  );
}
