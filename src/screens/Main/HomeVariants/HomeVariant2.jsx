import { Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { styles } from "./HomeVariant2.styles";
import { LinearGradient } from "expo-linear-gradient";

import { Timer } from "../../../components/common2/Timer/Timer";
import { Shifts } from "../../../components/common2/ShiftHistory/ShiftHistory";

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
        <View style={styles.projectSelector}>
          <Text style={styles.projectSelectorText}>Gruvrisvägen 70, 791 61 Falun</Text>
          <Image
          source={require("../../../assets/HomeScreen2/arrow-down.png")}

          /> 
        </View>

        <Timer />

        {/* MAIN BTN */}
        <View style={styles.mainActionButtons}>

          <TouchableOpacity style={styles.actionButton}>
            <Image
              source={require("../../../assets/HomeScreen2/iconAction.png")}
              style={styles.iconAction}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonCamera}>
            <Image
              source={require("../../../assets/HomeScreen2/CircleCamera.png")}
              style={styles.icon}
            />
          </TouchableOpacity>

        </View>

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
