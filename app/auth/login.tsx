import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, Divider } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../styles/colors";

export default function Login() {
  const router = useRouter();
  const { login, skip } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0,
    [email, password]
  );

  // login
  const handleLogin = async () => {
    if (!canSubmit) return;
    try {
      await login(email.trim(), password);
      router.replace("/"); 
    } catch {
      alert("Login failed");
    }
  };

  // 跳转signup页面
  const handleSignup = () => router.push("/auth/signup");

  // 测试用
  const handleSkip = () => {
    skip();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome Back
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={!canSubmit}
        style={styles.button}
      >
        Sign In
      </Button>

      <Divider style={styles.divider} />

      <Button mode="outlined" onPress={handleSignup} style={styles.button}>
        Create an Account
      </Button>

      <Button onPress={handleSkip} textColor={colors.textPrimary}>
        Continue as Guest
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9f9f9",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "white",
  },
  button: {
    marginVertical: 6,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
});

