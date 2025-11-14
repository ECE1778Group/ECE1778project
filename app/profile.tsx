import React, {useMemo, useState} from "react";
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "../contexts/AuthContext";
import {useUserApi} from "../lib/api/user";
import {useMessage} from "../contexts/MessageContext";
import {colors} from "../styles/colors";
import {globalStyles} from "../styles/globalStyles";

export default function ProfileScreen() {
  const {user, loggedIn, logout, updateUser} = useAuth();
  const {updateProfile} = useUserApi();
  const {showMessage} = useMessage();
  const router = useRouter();

  const [email, setEmail] = useState(user.email || "");
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => email.trim() && firstName.trim() && lastName.trim(),
    [email, firstName, lastName]
  );

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);

    try {
      const token = await AsyncStorage.getItem("access");
      if (!token) {
        showMessage("Session expired. Please log in again.", "error");
        router.replace("/auth/login");
        return;
      }

      const fields = {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };

      const res = await updateProfile(token, fields);
      if (res?.user) {
        updateUser(res.user);
        showMessage("Profile updated successfully!", "success");
      } else {
        showMessage("Update failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("Save failed:", err);
      showMessage("Server error. Please try again later.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!loggedIn) {
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
    <ScrollView
      contentContainerStyle={[globalStyles.container, {paddingHorizontal: 24, paddingTop: 60}]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>My Profile</Text>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="name@mail.utoronto.ca"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {/* First Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Your first name"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {/* Last Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Your last name"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {/* Save button */}
      <Pressable
        style={[styles.primaryBtn, (!canSave || saving) && styles.disabled]}
        disabled={!canSave || saving}
        onPress={handleSave}
      >
        <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Changes"}</Text>
      </Pressable>

      {/* Logout button */}
      <Pressable
        style={[styles.dangerBtn, {marginTop: 16}]}
        onPress={async () => {
          await logout();
          router.replace("/auth/login");
        }}
      >
        <Text style={styles.primaryText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    ...globalStyles.center,
  },
  tip: {
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
