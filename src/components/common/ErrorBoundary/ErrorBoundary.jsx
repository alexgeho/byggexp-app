import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import i18n from "../../../i18n";
import { captureException } from "../../../utils/sentry";

// Top-level error boundary: catches render/runtime errors in the tree and
// shows a recoverable fallback instead of a blank white screen. Must be a
// class component — only class components can be React error boundaries.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface the crash for debugging and report it to Sentry (no-op if no DSN).
    console.error("Unhandled UI error:", error, info?.componentStack);
    captureException(error, { componentStack: info?.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t("errorBoundary.title")}</Text>
          <Text style={styles.message}>{i18n.t("errorBoundary.message")}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {i18n.t("errorBoundary.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#F0F0F0",
  },
  title: {
    color: "#052D50",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#698196",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#0091FF",
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
