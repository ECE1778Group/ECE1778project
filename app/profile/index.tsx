import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useMessage } from "../../contexts/MessageContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { showMessage } = useMessage();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/847/847969.png" }}
          style={styles.avatar}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.idText}> Email: {user?.email ? user.email : "unknown"}</Text>
        </View>

        <Pressable onPress={() => router.push("/profile/edit")}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      {/* 第一组 */}
      <View style={styles.section}>
        <MenuRow
          icon={<Ionicons name="briefcase-outline" size={22} color="#555" />}
          text="My Post"
          onPress={() => {}}
        />

        <MenuRow
          icon={<Ionicons name="star-outline" size={22} color="#555" />}
          text="Star"
          onPress={() => {}}
        />

      {/* 第二组 */}
      <MenuRow
        icon={<Ionicons name="settings-outline" size={22} color="#555" />}
        text="Settings"
        onPress={() => {
          if (user.userId === "guest") {
            showMessage("Please login to access settings", "error");
            return;
          }
          router.push("/profile/edit");
        }}
      />
    </View>

      {/* 登出 */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>logout</Text>
      </Pressable>
    </ScrollView>
  );
}

interface MenuRowProps {
  icon: React.ReactNode;
  text: string;
  onPress?: () => void;
}

function MenuRow({ icon, text, onPress }: MenuRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowText}>{text}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  /* 顶部卡片 */
  headerCard: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
  },
  idText: {
    marginTop: 6,
    color: "#666",
    fontSize: 14,
  },
  arrow: {
    fontSize: 26,
    color: "#999",
    paddingLeft: 10,
  },

  section: {
    marginTop: 12,
    backgroundColor: "white",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  rowIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },
  rowArrow: {
    fontSize: 22,
    color: "#ccc",
  },

  /* Logout */
  logoutBtn: {
    marginTop: 30,
    backgroundColor: "white",
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    color: "red",
    fontWeight: "500",
  },
});