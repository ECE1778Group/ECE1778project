import React, {useCallback, useEffect, useRef, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {useFocusEffect, useRouter} from "expo-router";
import * as Clipboard from "expo-clipboard";
import ItemCard from "../components/ItemCard";
import CartFab from "../components/CartFab";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import {ArrowDownWideNarrow} from "lucide-react-native";
import {MarketplaceItem} from "../types";
import {useProductApi} from "../lib/api/product";

export default function Market() {
  const [text, setText] = useState("");
  const [data, setData] = useState<MarketplaceItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sharePrompt, setSharePrompt] = useState<{ id: string; title?: string } | null>(null);
  const [shareTimeoutProgress, setShareTimeoutProgress] = useState(1);
  const router = useRouter();
  const {searchProducts} = useProductApi();

  const lastClipboardRef = useRef<string | null>(null);

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
  }, [mapToItem, searchProducts]);

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

  const checkClipboardForShare = useCallback(async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (!clip || clip === lastClipboardRef.current) return;

      const idMatch = clip.match(/Item ID:\s*(\S+)/i);
      const titleMatch = clip.match(/Title:\s*(.+)/i);

      lastClipboardRef.current = clip;

      if (!idMatch || !idMatch[1]) {
        return;
      }

      const sharedId = idMatch[1];
      const sharedTitle = titleMatch?.[1]?.trim();
      setSharePrompt({id: sharedId, title: sharedTitle});
    } catch {
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkClipboardForShare();
    }, [checkClipboardForShare])
  );

  useEffect(() => {
    if (!sharePrompt) return;

    setShareTimeoutProgress(1);
    const totalMs = 5000;
    const start = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(totalMs - elapsed, 0);
      const fraction = remaining / totalMs;
      setShareTimeoutProgress(fraction);
      if (remaining <= 0) {
        clearInterval(timer);
        setSharePrompt(null);
      }
    }, 5);

    return () => {
      clearInterval(timer);
    };
  }, [sharePrompt]);

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
            <Text style={[styles.emptyText, {
              color: (colors as any).textSecondary || colors.placeholder,
              marginTop: 4,
              fontSize: 12
            }]}>
              Pull down to refresh
            </Text>
          </View>
        ) : null}
      />

      {sharePrompt ? (
        <Pressable
          style={styles.shareCard}
          onPress={() => {
            const targetId = sharePrompt.id;
            setSharePrompt(null);
            router.push({pathname: "/item/[id]", params: {id: targetId}});
          }}
        >
          <Text style={styles.shareCardTitle}>Open shared item?</Text>

          <View style={styles.shareCardMainRow}>
            <Text
              style={styles.shareCardItemTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {sharePrompt.title || "Shared item"}
            </Text>
            <View style={styles.shareCardActions}>
              <Pressable
                style={[styles.shareCardBtn, styles.shareCardCancel]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSharePrompt(null);
                }}
              >
                <Text style={styles.shareCardCancelText}>Later</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.shareCardProgressTrack}>
            <View
              style={[
                styles.shareCardProgressBar,
                {width: `${Math.max(0, Math.min(1, shareTimeoutProgress)) * 100}%`},
              ]}
            />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.fabWrapper}>
        <CartFab/>
      </View>
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
  fabWrapper: {
    position: "absolute",
    right: 18,
    bottom: 24,
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
  shareCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 5,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },
  shareCardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  shareCardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  shareCardItemTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  shareCardActions: {
    flexDirection: "row",
    gap: 6,
  },
  shareCardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  shareCardCancel: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  shareCardOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shareCardCancelText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  shareCardOpenText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  shareCardProgressTrack: {
    marginTop: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  shareCardProgressBar: {
    height: "100%",
    backgroundColor: colors.primary,
  },
});