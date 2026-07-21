import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) {
      Alert.alert("Ошибка входа", "Неверный email или пароль.");
    }
  };

  return (
    <LinearGradient
      colors={["#eaf2fb", "#dce9f6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.page}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.welcome, { fontFamily: theme.text.fontFamily.regular }]}>
            Welcome!
          </Text>
          <Text style={[styles.heading, { fontFamily: theme.text.fontFamily.regular }]}>
            Log In to your account
          </Text>
        </View>

        <Text style={styles.label}>E-Mail or Username</Text>
        <View style={styles.inputWrapper}>
          <Icon name="mail" size={16} color="#687898" style={styles.inputIcon} />
          <TextInput
            placeholder="example@gmail.com"
            placeholderTextColor="#a7b3c2"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="username"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Icon name="lock" size={16} color="#687898" style={styles.inputIcon} />
          <TextInput
            placeholder="your password here"
            placeholderTextColor="#a7b3c2"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
          style={[styles.button, isLoading && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={styles.footerLink}
        >
          <Text style={styles.footerText}>
            Don&apos;t have an account? <Text style={styles.footerLinkText}>Create here →</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 404,
    padding: 32,
    backgroundColor: "#ffffff",
    borderRadius: 16,
  },
  header: {
    marginBottom: 28,
  },
  welcome: {
    color: "#687898",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  heading: {
    color: "#052d50",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  label: {
    color: "#052d50",
    fontSize: 12,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e7ecf0",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#052d50",
    fontSize: 14,
  },
  button: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3183ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  footerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#687898",
    fontSize: 12,
  },
  footerLinkText: {
    color: "#052d50",
    fontWeight: "500",
  },
});
