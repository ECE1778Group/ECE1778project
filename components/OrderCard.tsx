import React, { useMemo } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { colors } from "../styles/colors";

export type OrderCardProps = {
  id: string;
  items: Array<{ imageUrl?: string }>;
  createdAt?: string | number | Date;
  status: "placed" | "completed" | "cancelled";
  onPress?: () => void;
};

function formatTime(d?: string | number | Date) {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t.getTime())) return "";
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")} ${String(
    t.getHours()
  ).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}

export default function OrderCard(props: OrderCardProps) {
  const { id, items, createdAt, status, onPress } = props;

  const stack = useMemo(() => items.slice(0, 3).map((x) => x.imageUrl).filter(Boolean) as string[], [items]);
  const statusText = useMemo(
    () => ({ placed: "Placed", completed: "Completed", cancelled: "Cancelled" }[status]),
    [status]
  );
  const timeText = useMemo(() => formatTime(createdAt), [createdAt]);

  const statusStyle = useMemo(() => {
    if (status === "cancelled") return { bg: colors.danger, fg: colors.white, border: colors.danger };
    if (status === "completed") return { bg: colors.background, fg: colors.textPrimary, border: colors.border };
    return { bg: colors.primary, fg: colors.white, border: colors.primary };
  }, [status]);

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} accessibilityRole="button">
      <View style={styles.row}>
        <View style={styles.mediaStack}>
          {stack.length === 0 ? (
            <View style={[styles.stackItem, { left: 24, backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          ) : (
            stack.map((uri, i) => (
              <Image
                key={`${id}-${i}`}
                source={{ uri }}
                style={[styles.stackItem, { left: i * 12, zIndex: 100 - i }]}
                resizeMode="cover"
              />
            ))
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>Order {id}</Text>
          <Text style={styles.time}>{timeText}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.fg }]}>{statusText}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  mediaStack: {
    width: 96,
    height: 64,
    marginRight: 12,
    position: "relative",
  },
  stackItem: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.placeholder,
    fontSize: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  time: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
});