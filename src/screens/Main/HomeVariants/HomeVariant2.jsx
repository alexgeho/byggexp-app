import { Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { styles } from "./HomeVariant2.styles";

export default function HomeVariant2() {
  function handleHomePress() {
    console.log("Home");
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text>9:41</Text>
        <Image
          source={require("../../../assets/HomeScreen2/battery_charging.png")}
        />
      </View>

      {/* MAIN */}
      <View style={styles.main}>
        {/* PROJECT SELECTOR */}
        <View style={styles.projectSelector}>
          <Text>Gruvrisvägen 70, 791 61 Falun</Text>
        </View>
        <View style={styles.timer}>
          <Text>06 59 59</Text>
        </View>

        {/* MAIN BTN */}
        <View style={styles.mainActionButtons}>
          <Image
            source={require("../../../assets/HomeScreen2/circle_circle.png")}
          />
          <Image
            source={require("../../../assets/HomeScreen2/circle_circle.png")}
          />
        </View>

        {/* SHIFTS */}
        <View style={styles.shiftHistorySection}>
          {/* SHIFT HEADER */}
          <View style={styles.shiftHeader}>
            <Text>Shift history</Text>
            <Text>View all</Text>
          </View>

          {/* SHIFT BODY */}
          <View style={styles.shiftBody}>
            <View style={styles.shiftBodyHeader}>
              <Text>July 2, 2025</Text>
            </View>

            <View style={styles.shiftBodyMain}>
              <View style={styles.shiftBodyMainLeft}>
                <Text>Gruvrisvägen 70, 791 61 Falun</Text>
              </View>

              <View style={styles.shiftBodyMainRight}>
                <Text>10h 5m</Text>
                <Text>08:32-18:37</Text>
              </View>
            </View>
          </View>
        </View>
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
    </View>
  );
}
