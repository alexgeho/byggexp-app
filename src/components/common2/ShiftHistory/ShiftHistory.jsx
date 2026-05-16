import React from "react";
import { View, Text } from "react-native";
import { styles } from "./ShiftHistory.styles";

export function Shifts() {
    return (
       <View style={styles.shiftHistorySection}>
          {/* SHIFT HEADER */}
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftHeaderText}>Shift history</Text>
            <Text style={styles.shiftHeaderText}>View all</Text>
          </View>

          {/* SHIFT BODY */}
          <View style={styles.shiftBody}>
            <View style={styles.shiftBodyHeader}>
              <Text style={styles.shiftBodyHeaderText}>July 2, 2025</Text>
            </View>

            <View style={styles.shiftBodyMain}>
              <View style={styles.shiftBodyMainLeft}>
                <Text style={styles.shiftBodyMainLeftText}>
                  Gruvrisvägen 70, 791 61
                </Text>
                <Text style={styles.shiftBodyMainLeftText}>Falun</Text>
              </View>

              <View style={styles.shiftBodyMainRight}>
                <Text style={styles.shiftBodyMainLeftText}>10h 5m</Text>
                <Text style={styles.shiftBodyHeaderText}>08:32-18:37</Text>
              </View>
            </View>
          </View>
        </View> 
    )
}
