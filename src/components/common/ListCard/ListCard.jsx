import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { cardStyles } from "../../../styles/cards";
import { useTheme } from "../../../theme/ThemeContext";

/* Shared "projects list" style card, used for every entity list (projects, tasks, employees, tools). */
export function ListCard({
  onPress,
  selected,
  title,
  titleNumberOfLines = 1,
  badgeLabel,
  badgeStyle,
  leading,
  children,
  style,
}) {
  const { theme } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
      style={[
        cardStyles.card,
        selected && cardStyles.cardSelected,
        selected && { borderColor: theme.colors.primary },
        style,
      ]}
    >
      <View
        style={[cardStyles.cardHeader, leading && { alignItems: "center" }]}
      >
        {leading}

        <Text
          numberOfLines={titleNumberOfLines}
          ellipsizeMode="tail"
          style={[
            cardStyles.cardTitle,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {title}
        </Text>

        {badgeLabel ? (
          <Text
            style={[
              cardStyles.cardBadge,
              badgeStyle,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {badgeLabel}
          </Text>
        ) : null}
      </View>

      {children}
    </Container>
  );
}
