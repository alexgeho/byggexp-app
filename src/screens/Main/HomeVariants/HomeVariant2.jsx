import { Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { styles } from "./HomeVariant2.styles";
import { LinearGradient } from "expo-linear-gradient";

import { Timer } from "../../../components/common2/Timer/Timer";
import { Shifts } from "../../../components/common2/ShiftHistory/ShiftHistory";
import { ProjectSelector } from "../../../components/common2/projectSelector/projectSelector";
import { MainActionButtons } from "../../../components/common2/mainActionButtons/mainActionButtons";

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
      {/*   <View style={styles.header}>
        <Text>9:41</Text>
        <Image
          source={require("../../../assets/HomeScreen2/battery_charging.png")}
        />
      </View> */}

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
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleHomePress}>
          <Image
            source={require("../../../assets/HomeScreen2/Circle-Clock.png")}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleHomePress}>
          <Image
            source={require("../../../assets/HomeScreen2/Folder-Check.png")}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleHomePress}>
          <Image source={require("../../../assets/HomeScreen2/Chat.png")} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleHomePress}>
          <Image source={require("../../../assets/HomeScreen2/User.png")} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
