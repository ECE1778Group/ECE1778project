import React, {useCallback, useEffect, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import ItemCard from "../components/ItemCard";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import {ArrowDownWideNarrow, ShoppingCart} from "lucide-react-native";
import {MarketplaceItem} from "../types";
import {useCart} from "../contexts/CartContext";
import {useProductApi} from "../lib/api/product";

export default function Market() {
  const [text, setText] = useState("");
  const [data, setData] = useState<MarketplaceItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const {count} = useCart();
  const {searchProducts} = useProductApi();

  const mapToItem = useCallback((p: any): MarketplaceItem => {
    const cat = String(p?.category ?? "").toLowerCase();
    const isBook = cat.includes("book");
    return {
      id: String(p.id),
      kind: isBook ? "book" : "other",
      title: String(p.title),
      price: Number(p.price) || 0,
      imageUrl: p.picture_url || undefined,
      distanceKm: undefined,
      courseCode: undefined,
      createdAt: undefined,
      stock: typeof p.quantity === "number" ? p.quantity : undefined,
      category: isBook ? undefined : (p.category as string | undefined),
      authors: undefined,
      isbn: undefined,
    } as MarketplaceItem;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await searchProducts("all");
        if (!cancelled) setData((res || []).map(mapToItem));
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setHasSearched(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapToItem]);

  const handleSearch = useCallback(async () => {
    const q = text.trim();
    if (!q) {
      setData([]);
      setHasSearched(true);
      return;
    }
    try {
      const res = await searchProducts(q);
      setData((res || []).map(mapToItem));
    } catch {
      setData([]);
    } finally {
      setHasSearched(true);
    }
  }, [text, searchProducts, mapToItem]);

  const handleRefresh = useCallback(async () => {
    const q = text.trim();
    const keyword = q || "all";
    setRefreshing(true);
    try {
      const res = await searchProducts(keyword);
      setData((res || []).map(mapToItem));
    } catch {
      setData([]);
    } finally {
      setHasSearched(true);
      setRefreshing(false);
    }
  }, [text, searchProducts, mapToItem]);

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
          placeholder="Search Items"
          placeholderTextColor={colors.placeholder}
          value={text}
          onChangeText={setText}
          returnKeyType="search"
          clearButtonMode="while-editing"
          onSubmitEditing={handleSearch}
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
            imageUrl={"imageUrl" in item ? item.imageUrl : undefined}
            distanceKm={"distanceKm" in item ? item.distanceKm : undefined}
            courseCode={"courseCode" in item ? item.courseCode : undefined}
            createdAt={"createdAt" in item ? item.createdAt : undefined}
            onPress={() => router.push({pathname: "/item/[id]", params: {id: item.id}})}
          />
        )}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 96, flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={hasSearched ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, {color: (colors as any).textSecondary || colors.placeholder}]}>
              No Items Available
            </Text>
            <Text style={[styles.emptyText, {color: (colors as any).textSecondary || colors.placeholder, marginTop: 4, fontSize: 12}]}>
              Pull down to refresh
            </Text>
          </View>
        ) : null}
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
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
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