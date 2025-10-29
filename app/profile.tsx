import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { colors } from "../styles/colors";
import { globalStyles } from "../styles/globalStyles";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { Settings } from "lucide-react-native";

export default function ProfileScreen() {
  const { isAuthenticated } = useAuth();
  const { profile, update } = useProfile();
  const router = useRouter();
  const nav = useNavigation();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [campus, setCampus] = useState(profile.campus ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  useEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push("/settings")} style={{ paddingHorizontal: 12 }}>
          <Settings size={20} color={colors.textPrimary} />
        </Pressable>
      ),
      title: "Profile",
    });
  }, [nav, router]);

  const canSave = useMemo(() => name.trim().length > 0 && email.trim().length > 0, [name, email]);

  if (!isAuthenticated) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text style={styles.tip}>Please sign in to view your profile.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.primaryText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingHorizontal: 16, paddingTop: 12 }]}>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@mail.utoronto.ca"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Campus</Text>
        <TextInput
          style={styles.input}
          value={campus}
          onChangeText={setCampus}
          placeholder="e.g., St. George"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="e.g., 647-000-0000"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, !canSave && styles.disabled]}
        disabled={!canSave}
        onPress={() => update({ name: name.trim(), email: email.trim(), campus: campus.trim(), phone: phone.trim() })}
      >
        <Text style={styles.primaryText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  tip: {
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 12,
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
});