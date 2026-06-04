import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AuthContext from '../../contexts/AuthContext';
import ActionButton from '../../components/common/ActionButton/ActionButton';
import { useTheme } from '../../theme/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { registerCompany, isLoading } = useContext(AuthContext);
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (isLoading) {
      return;
    }

    const trimmedCompany = companyName.trim();
    const trimmedName = userName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedCompany || !trimmedName || !trimmedEmail) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');

    const result = await registerCompany({
      companyName: trimmedCompany,
      userName: trimmedName,
      email: trimmedEmail,
    });

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: theme.text.fontFamily.regular }]}>
            Try for free
          </Text>
          <Text style={[styles.subtitle, { fontFamily: theme.text.fontFamily.regular }]}>
            Register your company in a few seconds
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          placeholder="Company name"
          style={styles.input}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
        />
        <TextInput
          placeholder="Your name"
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
          autoComplete="name"
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <ActionButton
          onPress={handleSignup}
          title={isLoading ? 'Creating account...' : 'Create account'}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#052D50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5a6b7d',
    textAlign: 'center',
  },
  error: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    borderRadius: 20,
    borderColor: 'transparent',
    outlineColor: '#0785F4',
    color: '#151515',
    boxShadow: '0 0 10px #00203A10',
  },
  loginLink: { marginTop: 16, alignItems: 'center' },
  loginText: { color: '#888', fontSize: 14 },
  loginTextBold: { color: '#0785F4', fontWeight: 'bold' },
});
