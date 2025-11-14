import React, {useMemo, useState} from "react";
import {StyleSheet, View} from "react-native";
import {Button, Divider, Text, TextInput} from "react-native-paper";
import {useRouter} from "expo-router";
import {useAuth} from "../../contexts/AuthContext";
import {colors} from "../../styles/colors";
import {useMessage} from "../../contexts/MessageContext";
import {globalStyles} from "../../styles/globalStyles";

export default function Login() {
  const router = useRouter();
  const {login, skip} = useAuth();
  const {showMessage} = useMessage();

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
      console.log("...")
      showMessage("Login successful!", "success");
      router.replace("/");
    } catch {
      showMessage("Login failed. Please check your email or password.", "error");
    }
  };

  // signup
  const handleSignup = () => router.push("/auth/signup");

  // Testing
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
        autoComplete="off"
        textContentType="none"
        autoCorrect={false}
        importantForAutofill="no"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoComplete="password-new"
        textContentType="newPassword"
        autoCorrect={false}
        importantForAutofill="no"
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

      <Divider style={styles.divider}/>

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
    ...globalStyles.authContainer,
  },
  title: {
    ...globalStyles.formTitleBase,
    marginBottom: 24,
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
