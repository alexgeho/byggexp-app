import React from "react";

import { useTheme } from "../../../theme/ThemeContext";

import HomeVariant1green from "./HomeVariant1green";
import HomeVariant2 from "./HomeVariant2";
import HomeVariant4darkGray from "./HomeVariant4darkGray";
import HomeVariant5orange from "./HomeVariant5orange";

export default function ThemeHomeScreen() {
  const { themeName } = useTheme();

  switch (themeName) {
    case "green":
      return <HomeVariant1green key="green" />;
    case "orange":
      return <HomeVariant5orange key="orange" />;
    case "darkGray":
      return <HomeVariant4darkGray key="darkGray" />;
    case "blue":
    default:
      return <HomeVariant2 key="blue" />;
  }
}
