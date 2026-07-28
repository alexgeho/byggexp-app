// Flat ESLint config built on Expo's shared rules (SDK 54).
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "web-build/**",
      "android/**",
      "ios/**",
      "babel.config.js",
    ],
  },
  {
    // Node CommonJS tooling scripts (CI helpers), not React Native code.
    files: ["scripts/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        __dirname: "readonly",
        module: "writable",
        require: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
  },
];
