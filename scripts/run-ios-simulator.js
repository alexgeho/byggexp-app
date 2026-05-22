const { execFileSync } = require("child_process");

const target = process.argv[2] || "default";
const runtimeSuffix = "iOS-18-2";

function getAvailableDevices() {
  const output = execFileSync(
    "xcrun",
    ["simctl", "list", "devices", "available", "--json"],
    { encoding: "utf8" },
  );
  const data = JSON.parse(output);
  const runtimeKey = Object.keys(data.devices || {}).find((key) =>
    key.endsWith(runtimeSuffix),
  );

  if (!runtimeKey) {
    console.error(
      "No available iOS 18.2 simulator runtime found. Install it in Xcode > Settings > Components.",
    );
    process.exit(1);
  }

  const devices = (data.devices[runtimeKey] || []).filter(
    (device) => device.isAvailable,
  );

  if (!devices.length) {
    console.error(
      "No available iOS 18.2 simulator found. Install the runtime and create a simulator.",
    );
    process.exit(1);
  }

  return devices;
}

function pickDevice(devices, mode) {
  if (mode === "se") {
    return devices.find((device) => /^iPhone SE/.test(device.name));
  }

  if (mode === "15") {
    return devices.find((device) => /^iPhone 15$/.test(device.name));
  }

  if (mode === "16") {
    return devices.find((device) => /^iPhone 16$/.test(device.name));
  }

  return (
    devices.find((device) => /^iPhone 16$/.test(device.name)) ||
    devices.find((device) => /^iPhone 15$/.test(device.name)) ||
    devices.find((device) => /^iPhone SE/.test(device.name)) ||
    devices[0]
  );
}

const devices = getAvailableDevices();
const preferred = pickDevice(devices, target);

if (!preferred) {
  const label =
    target === "default"
      ? "preferred iPhone 16, iPhone 15, or iPhone SE"
      : `iPhone ${target.toUpperCase()}`;

  console.error(`No available ${label} simulator found for iOS 18.2.`);
  process.exit(1);
}

execFileSync(
  "npx",
  ["expo", "run:ios", "--device", preferred.udid],
  { stdio: "inherit" },
);
