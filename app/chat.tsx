import React from "react";
import {FlatList, View} from "react-native";
import {globalStyles} from "../styles/globalStyles";
import UserCard from "../components/UserCard";

const threads = [
  {threadId: "t1", peerName: "Alice Zhang", role: "seller" as const, avatarUrl: "https://i.pravatar.cc/100?u=alice"},
  {threadId: "t2", peerName: "Bob Chen", role: "buyer" as const, avatarUrl: "https://i.pravatar.cc/100?u=bob"},
  {threadId: "t3", peerName: "Carol Liu", role: "seller" as const, avatarUrl: "https://i.pravatar.cc/100?u=carol"},
];

export default function Chat() {
  return (
    <View style={globalStyles.container}>
      <FlatList
        data={threads}
        keyExtractor={(x) => x.threadId}
        renderItem={({item}) => (
          <UserCard
            threadId={item.threadId}
            peerName={item.peerName}
            role={item.role}
            avatarUrl={item.avatarUrl}
          />
        )}
        contentContainerStyle={{paddingVertical: 8}}
      />
    </View>
  );
}