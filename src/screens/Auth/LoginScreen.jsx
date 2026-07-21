import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AuthContext from "../../contexts/AuthContext";
import ActionButton from "../../components/common/ActionButton/ActionButton";
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
    <View style={styles.container}>
      <Text
        style={[styles.text, { fontFamily: theme.text.fontFamily["regular"] }]}
      >
        Nice to meet You!
      </Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <ActionButton
        onPress={handleLogin}
        title={isLoading ? "Login..." : "Login"}
        disabled={isLoading}
      />
      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={styles.registerLink}
      >
        <Text style={styles.registerText}>
          No account? <Text style={styles.registerTextLink}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  input: {
    borderWidth: 1,
    padding: 16,
    fontSize: 22,
    marginBottom: 10,
    borderRadius: 20,
    borderColor: "transparent",
    outlineColor: "#0785F4",
    color: "#151515",
    boxShadow: "0 0 10px #00203A10",
  },
  text: {
    width: "100%",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 22,
    color: "#C7C7CD",
  },
  registerLink: { marginTop: 16, alignItems: "center" },
  registerText: { color: "#C7C7CD", fontSize: 22 },
  registerTextLink: { color: "#77BCF9" },
});
