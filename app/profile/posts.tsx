// app/profile/my-posts.tsx

import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, Text, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import ItemCard from "../../components/ItemCard";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../styles/colors";
import { MarketplaceItem } from "../../types";
import { useProductApi } from "../../lib/api/product";
import { useAuth } from "../../contexts/AuthContext";

export default function MyPostsScreen() {
  const { user } = useAuth();
  const username = user?.username;
  const { searchProducts } = useProductApi();

  const [data, setData] = useState<MarketplaceItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const mapToItem = useCallback((p: any): MarketplaceItem => {
    const catRaw = String(p?.category ?? "");
    const cat = catRaw.toLowerCase();
    const isBook = cat.includes("book");
    return {
      id: String(p.id),
      kind: isBook ? "book" : "other",
      title: String(p.title),
      price: Number(p.price) || 0,
      imageUrl: p.picture_url || undefined,
      createdAt: undefined,
      stock: typeof p.quantity === "number" ? p.quantity : undefined,
      category: catRaw || (isBook ? "book" : undefined),
      sellerUsername: typeof p.seller_username === "string" ? p.seller_username : undefined,
    } as MarketplaceItem;
  }, []);

  const loadMyPosts = useCallback(async () => {
    if (!username) return;
    setRefreshing(true);
    try {
      const res = await searchProducts("all");
      const items = (res || []).map(mapToItem);
      const mine = items.filter((item) => item.sellerUsername === username);
      setData(mine);
    } catch {
      setData([]);
    } finally {
      setRefreshing(false);
      setLoadedOnce(true);
    }
  }, [searchProducts, mapToItem, username]);

  useFocusEffect(
    useCallback(() => {
      loadMyPosts();
    }, [loadMyPosts])
  );

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Posts</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMyPosts} />
        }
        renderItem={({ item }) => (
          <ItemCard
            id={item.id}
            title={item.title}
            price={item.price}
            imageUrl={item.imageUrl}
            category={item.category}
            sellerUsername={item.sellerUsername}
            onPress={() => {}}
          />
        )}
        ListEmptyComponent={
          loadedOnce && !refreshing ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Items you list for sale will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.placeholder,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  emptyWrap: {
    flex: 1,
    ...globalStyles.center,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: "center",
  },
});
