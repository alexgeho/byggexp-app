import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./footer.styles";
import { footerButtons } from "../../../constants/footerButtonsVariant2";

export function FooterButtonsVariant2({
  iconStyle,
}) {
  const navigation = useNavigation();

function handlePress(button) {
  if (button.goBack) {
    navigation.goBack();
    return;
  }

  navigation.navigate(button.screen);
}

  return (
    <View style={styles.footer}>
      {footerButtons.map(function renderButton(button) {
        return (
          <TouchableOpacity
            key={button.id}
            onPress={function onButtonPress() {
              handlePress(button);
            }}
          >
            <Image
              source={button.icon}
              style={iconStyle}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
