import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useFetch } from "../../lib/api/fetch-client";
import { colors } from "../../styles/colors";
import { globalStyles } from "../../styles/globalStyles";

interface ThreadItem {
  id: string;
  peer_username: string;
  peer_first_name?: string;
  peer_last_name?: string;
  last_message: string;
  last_time: string;
}

export default function ChatListScreen() {
  const { getData, loading, error } = useFetch();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const router = useRouter();

  const loadThreads = useCallback(async () => {
    try {
      const data = await getData("/api/chat/threads/");
      console.log("threads:", data);
      setThreads(data);
    } catch (e) {
      console.log("load threads error", e);
    }
  }, [getData]);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads])
  );

  const renderItem = ({ item }: { item: ThreadItem }) => {
    const name =
      item.peer_first_name || item.peer_last_name
        ? `${item.peer_first_name || ""} ${item.peer_last_name || ""}`.trim()
        : item.peer_username;

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: "/chat/[threadId]",
            params: {
              threadId: item.id,
              peerUsername: item.peer_username,
            },
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : "?"}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.last_message || "No messages yet"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshing={loading}
        onRefresh={loadThreads}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  lastMsg: {
    color: colors.placeholder,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
});
