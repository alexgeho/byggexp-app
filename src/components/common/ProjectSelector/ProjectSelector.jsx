import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ProjectSelector({ value, onPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>
          {value?.name || "Select or create project"}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    elevation: 10,
  },

  text: {
  flex: 1,
  fontSize: 16,
  color: 'white',
  fontWeight: '500',
},

  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  arrow: {
    fontSize: 14,
    color: '#2B2B2B',
    marginLeft: 8,
    opacity: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
