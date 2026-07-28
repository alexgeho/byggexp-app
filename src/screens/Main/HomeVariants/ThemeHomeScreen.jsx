import React from "react";

import HomeVariant2 from "./HomeVariant2";

// All active themes (blue, black, lightBlue, colorful) share the HomeVariant2
// layout; colors come from the selected theme via useTheme inside it.
export default function ThemeHomeScreen() {
  return <HomeVariant2 />;
}
