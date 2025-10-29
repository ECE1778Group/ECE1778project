import React, { useMemo } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../styles/colors";
import { MarketplaceItem } from "../../types";

const items: MarketplaceItem[] = [
  {
    id: "1",
    kind: "book",
    title: "ECE472 Textbook (9th ed.)",
    price: 45,
    imageUrl: "https://picsum.photos/seed/ece472/600/400",
    distanceKm: 0.7,
    courseCode: "ECE472",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isbn: "978-1-23456-789-7",
    authors: ["A. Author"],
  },
  {
    id: "2",
    kind: "book",
    title: "Linear Algebra Notes Bundle",
    price: 10,
    imageUrl: "https://picsum.photos/seed/la/600/400",
    distanceKm: 1.3,
    courseCode: "MAT223",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    kind: "other",
    title: "Dorm Lamp",
    price: 0,
    imageUrl: "https://picsum.photos/seed/lamp/600/400",
    distanceKm: 0.3,
    courseCode: "",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "home",
  },
];

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const item = useMemo(() => items.find((it) => it.id === String(id)), [id]);

  if (!item) {
    return (
      <View style={[globalStyles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Not found</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mediaBox}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>

        <View style={styles.metaRow}>
          {item.courseCode ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.courseCode}</Text>
            </View>
          ) : null}
          {item.distanceKm != null ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.distanceKm.toFixed(1)} km</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.bodyText}>
          This is mock detail data for local testing. Replace with backend data later.
        </Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable style={styles.cartBtn} onPress={() => Alert.alert("Added to cart")}>
          <Text style={styles.actionText}>Add to Cart</Text>
        </Pressable>
        <Pressable style={styles.buyBtn} onPress={() => Alert.alert("Buy now")}>
          <Text style={styles.buyText}>Buy Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  mediaBox: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginTop: 8,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: colors.placeholder,
    fontSize: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  bodyText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  buyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buyText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});