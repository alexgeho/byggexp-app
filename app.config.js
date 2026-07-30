// Dynamic Expo config layered on top of app.json.
// google-services.json is gitignored, so for EAS cloud builds it is supplied
// as a file secret (env var GOOGLE_SERVICES_JSON). Locally it falls back to
// the file in the project root.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
