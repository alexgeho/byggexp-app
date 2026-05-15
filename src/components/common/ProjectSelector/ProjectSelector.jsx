import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";

export default function ProjectSelector({ value, onPress, style }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          style,
          {
            backgroundColor: theme.colors.selectorBackground,
            borderColor: theme.colors.selectorBorder,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.text,
            },
          ]}
        >
          {value?.name || "Select or create project"}
        </Text>

        <Text
          style={[
            styles.arrow,
            {
              color: theme.colors.selectorArrow,
            },
          ]}
        >
          ▼
        </Text>
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
    fontWeight: "500",
  },

  selectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },

  arrow: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
});