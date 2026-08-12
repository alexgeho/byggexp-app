module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@theme": "./src/theme",
            "@hooks": "./src/hooks",
            "@contexts": "./src/contexts",
            "@services": "./src/services",
            "@utils": "./src/utils",
            "@constants": "./src/constants",
            "@assets": "./src/assets",
          },
        },
      ],
    ],
  };
};
