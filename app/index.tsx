import React, {useMemo, useState} from "react";
import {FlatList, Pressable, StyleSheet, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import ItemCard from "../components/ItemCard";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import {ArrowDownWideNarrow, ShoppingCart} from "lucide-react-native";
import {MarketplaceItem} from "../types";
import {useCart} from "../contexts/CartContext";

const items: MarketplaceItem[] = [
  {
    id: "1",
    kind: "book",
    title: "ECE472 Textbook (9th ed.)",
    price: 45,
    imageUrl: "https://picsum.photos/seed/ece472/200/200",
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
    imageUrl: "https://picsum.photos/seed/la/200/200",
    distanceKm: 1.3,
    courseCode: "MAT223",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    kind: "other",
    title: "Dorm Lamp",
    price: 0,
    imageUrl: "https://picsum.photos/seed/lamp/200/200",
    distanceKm: 0.3,
    courseCode: "",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "home",
  },
];

export default function Market() {
  const [text, setText] = useState("");
  const router = useRouter();
  const {count} = useCart();

  const data = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.title.toLowerCase().includes(q));
  }, [text]);

  const filled = count > 0;

  return (
    <View style={globalStyles.container}>
      <View style={styles.searchRow}>
        <Pressable style={styles.filterButton} onPress={() => {
        }} accessibilityRole="button" accessibilityLabel="Filter">
          <ArrowDownWideNarrow size={20} color={colors.textPrimary}/>
        </Pressable>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title"
          placeholderTextColor={colors.placeholder}
          value={text}
          onChangeText={setText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <ItemCard
            id={item.id}
            title={item.title}
            price={item.price}
            imageUrl={item.imageUrl}
            distanceKm={item.distanceKm}
            courseCode={item.courseCode}
            createdAt={item.createdAt}
            onPress={() => router.push({pathname: "/item/[id]", params: {id: item.id}})}
          />
        )}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 96}}
        keyboardShouldPersistTaps="handled"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open cart"
        onPress={() => router.push("/cart")}
        style={({pressed}) => [
          styles.fab,
          filled ? styles.fabFilled : styles.fabEmpty,
          pressed && styles.fabPressed,
        ]}
      >
        <ShoppingCart size={22} color={filled ? colors.white : colors.primary}/>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 5,
  },
  fabFilled: {
    backgroundColor: colors.primary,
  },
  fabEmpty: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderWidth: 1,
  },
  fabPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.9,
  },
});