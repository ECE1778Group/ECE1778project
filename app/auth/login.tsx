import React, {useMemo, useState} from "react";
import {Alert, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import {useRouter} from "expo-router";
import {useAuth} from "../../contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const {login, skip} = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (e) {
      Alert.alert("Login failed");
    }
  };

  const onSkip = () => {
    skip();
    router.push("/");
  };

  return (
    <View style={[globalStyles.container, styles.center]}>
      <Text style={styles.title}>Welcome</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@mail.utoronto.ca"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </View>

      <Pressable style={[styles.primaryBtn, !canSubmit && styles.disabled]} onPress={onSubmit} disabled={!canSubmit}>
        <Text style={styles.primaryText}>Sign In / Sign Up</Text>
      </Pressable>

      <Pressable style={styles.ghostBtn} onPress={onSkip}>
        <Text style={styles.ghostText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  ghostText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});