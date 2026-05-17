import { Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { styles } from "./HomeVariant2.styles";
import { LinearGradient } from "expo-linear-gradient";

import { Timer } from "../../../components/common2/Timer/Timer";
import { Shifts } from "../../../components/common2/ShiftHistory/ShiftHistory";
import { ProjectSelector } from "../../../components/common2/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";
import { FooterButtonsVariant2 } from "../../../components/common2/footer/footer";

export default function HomeVariant2() {
  function handleHomePress() {
    console.log("Home");
  }
  return (
    <LinearGradient
      colors={["#84E2FF", "#2582D9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >

      {/* MAIN */}
      <View style={styles.main}>

        {/* PROJECT SELECTOR */}
        <ProjectSelector />

        {/* Timer */}
        <Timer />

        {/* MAIN BTN */}
        <MainActionButtons/>

        {/* SHIFTS */}
        <Shifts />
      </View>

      {/* FOOTER */}
      <FooterButtonsVariant2/>

    </LinearGradient>
  );
}
