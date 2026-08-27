import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { useTheme } from "../../../theme/ThemeContext";

// Map center used before the user has picked anything (central Stockholm),
// matching the geofence guard's default reference point.
const DEFAULT_CENTER = { latitude: 59.3293, longitude: 18.0686 };

const round6 = (value) => Number(value).toFixed(6);

// Builds the Leaflet document once. Initial coordinate/radius are baked in; all
// later changes are pushed via injectJavaScript (setRadius / setCoordinate) so
// the WebView never reloads.
const buildHtml = ({
  hasInitial,
  latitude,
  longitude,
  radius,
  primary,
}) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  #map { background: #e9eef2; }
  .leaflet-control-attribution { display: none; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var RN = window.ReactNativeWebView;
  function post(obj){ if (RN) { RN.postMessage(JSON.stringify(obj)); } }

  var hasInitial = ${hasInitial ? "true" : "false"};
  var radius = ${radius};
  var primary = "${primary}";
  var center = hasInitial ? [${latitude}, ${longitude}] : [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}];

  var map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView(center, hasInitial ? 16 : 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  var marker = null;
  var circle = null;

  function ensureMarker(lat, lng) {
    if (!marker) {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      circle = L.circle([lat, lng], {
        radius: radius, color: primary, weight: 2,
        fillColor: primary, fillOpacity: 0.12,
      }).addTo(map);
      marker.on('dragstart', function(){ post({ type: 'lock' }); });
      marker.on('drag', function(){ circle.setLatLng(marker.getLatLng()); });
      marker.on('dragend', function(){
        var p = marker.getLatLng();
        circle.setLatLng(p);
        post({ type: 'coordinate', latitude: p.lat, longitude: p.lng });
        post({ type: 'unlock' });
      });
    } else {
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
    }
  }

  if (hasInitial) { ensureMarker(${latitude}, ${longitude}); }

  map.on('click', function(e){
    ensureMarker(e.latlng.lat, e.latlng.lng);
    post({ type: 'coordinate', latitude: e.latlng.lat, longitude: e.latlng.lng });
  });
  map.on('movestart', function(){ post({ type: 'lock' }); });
  map.on('moveend', function(){ post({ type: 'unlock' }); });

  window.setRadius = function(m){
    radius = m;
    if (circle) { circle.setRadius(m); }
  };
  window.setCoordinate = function(lat, lng){
    ensureMarker(lat, lng);
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  };

  setTimeout(function(){ map.invalidateSize(); }, 300);
  post({ type: 'ready' });
</script>
</body>
</html>`;

// Interactive map for the project location picker: a draggable pin plus a
// radius circle that tracks the activation-area slider. Tapping the map or
// dragging the pin reports a new coordinate to the parent.
export const LocationMapPicker = ({
  latitude,
  longitude,
  radiusMeters,
  onPickCoordinate,
  onInteractionChange,
}) => {
  const { theme } = useTheme();
  const webRef = useRef(null);
  // Coordinate last emitted BY the map, so an incoming prop update that merely
  // echoes our own drag doesn't recenter and fight the user.
  const lastEmittedRef = useRef(null);

  const html = useMemo(
    () =>
      buildHtml({
        hasInitial: latitude != null && longitude != null,
        latitude: latitude ?? DEFAULT_CENTER.latitude,
        longitude: longitude ?? DEFAULT_CENTER.longitude,
        radius: radiusMeters,
        primary: theme.colors.primary,
      }),
    // Intentionally mount once; later updates go through injectJavaScript.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleMessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (data.type === "coordinate") {
      lastEmittedRef.current = `${round6(data.latitude)},${round6(
        data.longitude,
      )}`;
      onPickCoordinate?.(data.latitude, data.longitude);
    } else if (data.type === "lock") {
      onInteractionChange?.(true);
    } else if (data.type === "unlock") {
      onInteractionChange?.(false);
    }
  };

  // Push slider changes into the circle.
  useEffect(() => {
    webRef.current?.injectJavaScript(
      `window.setRadius && window.setRadius(${Number(radiusMeters)});true;`,
    );
  }, [radiusMeters]);

  // Follow externally-set coordinates (address search), but skip the echo of
  // our own drag/tap.
  useEffect(() => {
    if (latitude == null || longitude == null) {
      return;
    }
    const key = `${round6(latitude)},${round6(longitude)}`;
    if (key === lastEmittedRef.current) {
      return;
    }
    webRef.current?.injectJavaScript(
      `window.setCoordinate && window.setCoordinate(${Number(latitude)}, ${Number(
        longitude,
      )});true;`,
    );
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e9eef2",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
