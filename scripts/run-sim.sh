#!/usr/bin/env bash
# One-command launch of the ByggExp dev client on the iOS simulator, pointed at
# the running Metro server. Use this instead of pressing `i` in `expo start`
# (which can target a stale/deleted simulator UUID).
#
# Usage:
#   1. In one terminal: npx expo start   (leave it running)
#   2. In another:       npm run sim
set -euo pipefail

APP_ID="com.anonymous.totbygghubmobileapp"
SIM_NAME="${SIM_NAME:-iPhone 16 Preview}"
METRO_URL="${METRO_URL:-http://localhost:8081}"

# Resolve the UDID of an available simulator by name.
UDID=$(xcrun simctl list devices available \
  | grep -F "$SIM_NAME (" \
  | grep -oE '[0-9A-Fa-f-]{36}' | head -1 || true)

if [ -z "$UDID" ]; then
  echo "No available simulator named '$SIM_NAME'. Available iPhones:"
  xcrun simctl list devices available | grep -i iphone
  echo "Set one:  SIM_NAME='iPhone 15' npm run sim"
  exit 1
fi

echo "→ Simulator: $SIM_NAME ($UDID)"
xcrun simctl boot "$UDID" 2>/dev/null || true   # already-booted is fine
open -a Simulator
xcrun simctl bootstatus "$UDID" >/dev/null 2>&1 || true

# Launch the dev client (must be installed by a prior dev build) and point it at
# Metro. If the app isn't installed yet, tell the user how to build it once.
if ! xcrun simctl get_app_container "$UDID" "$APP_ID" >/dev/null 2>&1; then
  echo "⚠️  Dev client '$APP_ID' is not installed on this simulator."
  echo "    Build+install it once with:  npx expo run:ios"
  exit 1
fi

xcrun simctl launch "$UDID" "$APP_ID" >/dev/null 2>&1 || true
sleep 1
xcrun simctl openurl "$UDID" "byggexp://expo-development-client/?url=${METRO_URL}"
echo "✓ Launched. If it shows the dev launcher, tap the $METRO_URL server."
