import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../contexts/AuthContext";
import { useUserApi } from "../../lib/api/user";
import { useMessage } from "../../contexts/MessageContext";
import { colors } from "../../styles/colors";
import { globalStyles } from "../../styles/globalStyles";
import { BASE_URL } from "../../constant";
import { mapToImageHost } from "../../lib/utils/imageHost";

const CHAT_UPLOAD_URL = `${BASE_URL}/api/chat/upload-image/`;

export default function ProfileScreen() {
  const { user, loggedIn, updateUser } = useAuth();
  const { updateProfile } = useUserApi();
  const { showMessage } = useMessage();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const email = user.email; // 不可编辑
  const username = user.username; // 不可编辑
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    mapToImageHost((user as any).avatar_url)
  );
  const [avatarUploading, setAvatarUploading] = useState(false);

  const canSave = useMemo(
    () => firstName.trim() && lastName.trim(),
    [firstName, lastName]
  );

  const initials = useMemo(() => {
    const fn = firstName?.trim?.() || "";
    const ln = lastName?.trim?.() || "";
    if (!fn && !ln) return (username || "?")[0]?.toUpperCase?.() || "?";
    return (fn[0] + (ln[0] || "")).toUpperCase();
  }, [firstName, lastName, username]);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("access");
      if (!token) return router.replace("/auth/login");

      const res = await updateProfile(token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUrl ?? null,
      });

      if (res?.user) {
        updateUser(res.user);
        showMessage("Profile updated successfully!", "success");
        setEditing(false);
      } else {
        showMessage("Update failed.", "error");
      }
    } catch (e) {
      console.error(e);
      showMessage("Server error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatarImage = async (localUri: string): Promise<string> => {
    const jwt = await AsyncStorage.getItem("access");
    if (!jwt) throw new Error("No auth token");

    const formData = new FormData();
    const filename = localUri.split("/").pop() || "avatar.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const mime =
      ext === "png" ? "image/png" :
      ext === "heic" ? "image/heic" :
      "image/jpeg";

    formData.append("image", {
      uri: localUri,
      name: filename,
      type: mime,
    } as any);

    const res = await fetch(CHAT_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error("Upload failed");
    return data.url;
  };

  const handlePickAvatar = async () => {
    if (avatarUploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      showMessage("Please allow photo access.", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    setAvatarUploading(true);

    try {
      const rawUrl = await uploadAvatarImage(localUri);
      const mapped = mapToImageHost(rawUrl);
      setAvatarUrl(mapped);

      const token = await AsyncStorage.getItem("access");
      const res = await updateProfile(token!, { avatar_url: rawUrl });

      if (res?.user) {
        updateUser(res.user);
        showMessage("Avatar updated!", "success");
      }
    } catch (e) {
      console.error(e);
      showMessage("Failed to upload avatar.", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!loggedIn) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text>Please sign in to view your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.container,
        { padding: 24, paddingTop: 40 },
      ]}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Pressable style={styles.avatarPressable} onPress={handlePickAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.avatarHint}>
          {avatarUploading ? "Uploading..." : "Tap to change avatar"}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!editing ? (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable disabled={!canSave} onPress={handleSave}>
            <Text style={[styles.saveText, !canSave && { opacity: 0.3 }]}>
              Save
            </Text>
          </Pressable>
        )}
      </View>

      {/* Username (readonly) */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>Username</Text>
        <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
          {username || "—"}
        </Text>
      </View>

      {/* Email (readonly) */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>Email</Text>
        <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
          {email}
        </Text>
      </View>

      {/* First Name */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>First Name</Text>
        {!editing ? (
          <Text style={styles.itemValue}>{firstName}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />
        )}
      </View>

      {/* Last Name */}
      <View style={styles.item}>
        <Text style={styles.itemLabel}>Last Name</Text>
        {!editing ? (
          <Text style={styles.itemValue}>{lastName}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />
        )}
      </View>
    </ScrollView>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  avatarPressable: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  avatarInitials: { fontSize: 32, fontWeight: "700" },
  avatarHint: { marginTop: 8, fontSize: 12, color: colors.placeholder },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  editText: { fontSize: 16, color: colors.primary },
  saveText: { fontSize: 16, color: colors.primary },

  item: { marginBottom: 26 },
  itemLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  itemValue: { fontSize: 17 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "white",
  },

  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});
