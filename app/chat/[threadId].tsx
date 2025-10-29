import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";

export default function ChatThread() {
  const {threadId} = useLocalSearchParams<{ threadId: string }>();

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.sub}>Thread: {String(threadId)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>Chat UI coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {padding: 16, borderBottomColor: colors.border, borderBottomWidth: 1},
  title: {color: colors.textPrimary, fontSize: 18, fontWeight: "700"},
  sub: {color: colors.placeholder, fontSize: 12, marginTop: 4},
  body: {flex: 1, alignItems: "center", justifyContent: "center"},
  placeholder: {color: colors.placeholder, fontSize: 14},
});