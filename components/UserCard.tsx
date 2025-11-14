import React from "react";
import {Image, Pressable, StyleSheet, Text, View} from "react-native";
import {useRouter} from "expo-router";
import {colors} from "../styles/colors";
import {MessageCircle} from "lucide-react-native";
import {globalStyles} from "../styles/globalStyles";

export type UserCardProps = {
  threadId: string;
  peerName: string;
  role: "buyer" | "seller";
  avatarUrl?: string;
  onPress?: () => void;
};

export default function UserCard(props: UserCardProps) {
  const {threadId, peerName, role, avatarUrl, onPress} = props;
  const router = useRouter();

  const handlePress = () => {
    if (onPress) onPress();
    else router.push({pathname: "/chat/[threadId]", params: {threadId}});
  };

  return (
    <Pressable onPress={handlePress} style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
               accessibilityRole="button">
      <View style={styles.row}>
        <View style={styles.avatarBox}>
          {avatarUrl ? (
            <Image source={{uri: avatarUrl}} style={styles.avatar}/>
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{peerName.trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>{peerName}</Text>
          <View style={styles.metaRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role === "buyer" ? "Buyer" : "Seller"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          <MessageCircle size={20} color={colors.primary}/>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...globalStyles.cardBase,
    padding: 12,
  },
  cardPressed: {
    ...globalStyles.cardPressed,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginRight: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleBadge: {
    ...globalStyles.tag,
  },
  roleText: {
    ...globalStyles.tagText,
  },
  right: {
    marginLeft: 8,
  },
});