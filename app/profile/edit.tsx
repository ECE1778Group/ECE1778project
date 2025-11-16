import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useUserApi } from "../../lib/api/user";
import { useMessage } from "../../contexts/MessageContext";
import { colors } from "../../styles/colors";
import { globalStyles } from "../../styles/globalStyles";

export default function ProfileScreen() {
  const { user, loggedIn, logout, updateUser } = useAuth();
  const { updateProfile } = useUserApi();
  const { showMessage } = useMessage();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
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
        setEditing(false);
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
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.primaryText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[globalStyles.container, { padding: 24, paddingTop: 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable disabled={!canSave} onPress={handleSave}>
            <Text
              style={[
                styles.saveText,
                !canSave && { opacity: 0.3 },
              ]}
            >
              Save
            </Text>
          </Pressable>
        )}
      </View>

      {/* First Name */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>First Name</Text>
        {!editing ? (
          <Text style={styles.itemValue}>{firstName || "—"}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Your first name"
            placeholderTextColor={colors.placeholder}
          />
        )}
      </View>

      {/* Last Name */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>Last Name</Text>
        {!editing ? (
          <Text style={styles.itemValue}>{lastName || "—"}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Your last name"
            placeholderTextColor={colors.placeholder}
          />
        )}
      </View>

      {/* Email */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>Email</Text>
        {!editing ? (
          <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
            {email}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@mail.utoronto.ca"
            placeholderTextColor={colors.placeholder}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  editText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
  },
  item: {
    marginBottom: 28,
  },
  itemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  itemValue: {
    fontSize: 17,
    color: colors.textPrimary,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  signoutBtn: {
    marginTop: 24,
    paddingVertical: 12,
  },
  signoutText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: "700",
    textAlign: "center",
  },
  center: {
    ...globalStyles.center,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  tip: {
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
});