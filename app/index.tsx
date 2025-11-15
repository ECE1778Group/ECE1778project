import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {useFocusEffect, useRouter} from "expo-router";
import * as Clipboard from "expo-clipboard";
import ItemCard from "../components/ItemCard";
import CartFab from "../components/CartFab";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import {Slider} from "@miblanchard/react-native-slider";
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
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedMinPrice, setSelectedMinPrice] = useState<number | null>(null);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null);
  const router = useRouter();
  const {searchProducts} = useProductApi();

  const lastClipboardRef = useRef<string | null>(null);

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

  const applySearchResults = useCallback(
    (res: any[] | null | undefined) => {
      const items = (res || []).map(mapToItem);
      setData(items);
      if (items.length) {
        const prices = items.map((item) => item.price || 0);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange({min, max});
        setSelectedMinPrice(min);
        setSelectedMaxPrice(max);
      } else {
        setPriceRange(null);
        setSelectedMinPrice(null);
        setSelectedMaxPrice(null);
        setFilterVisible(false);
      }
    },
    [mapToItem]
  );

  const handleSearch = useCallback(async () => {
    const q = text.trim();
    const keyword = q || "all";
    try {
      const res = await searchProducts(keyword);
      applySearchResults(res);
    } catch {
      setData([]);
      setPriceRange(null);
      setSelectedMinPrice(null);
      setSelectedMaxPrice(null);
      setFilterVisible(false);
    } finally {
      setHasSearched(true);
    }
  }, [text, searchProducts, applySearchResults]);

  const handleRefresh = useCallback(async () => {
    const q = text.trim();
    const keyword = q || "all";
    setRefreshing(true);
    try {
      const res = await searchProducts(keyword);
      applySearchResults(res);
    } catch {
      setData([]);
      setPriceRange(null);
      setSelectedMinPrice(null);
      setSelectedMaxPrice(null);
      setFilterVisible(false);
    } finally {
      setHasSearched(true);
      setRefreshing(false);
    }
  }, [text, searchProducts, applySearchResults]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const timer = setTimeout(() => {
        if (!cancelled) {
          handleRefresh();
        }
      }, 800);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [handleRefresh])
  );

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

  const filteredData = useMemo(() => {
    if (!priceRange || selectedMinPrice == null || selectedMaxPrice == null) {
      return data;
    }
    const min = Math.min(selectedMinPrice, selectedMaxPrice);
    const max = Math.max(selectedMinPrice, selectedMaxPrice);
    return data.filter((item) => {
      const price = item.price || 0;
      return price >= min && price <= max;
    });
  }, [data, priceRange, selectedMinPrice, selectedMaxPrice]);

  return (
    <View style={globalStyles.container}>
      <View style={styles.searchRow}>
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            if (!priceRange) return;
            setFilterVisible((v) => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel="Filter"
        >
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
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <ItemCard
            id={item.id}
            title={item.title}
            price={item.price}
            imageUrl={item.imageUrl}
            category={item.category}
            sellerUsername={item.sellerUsername}
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

      {filterVisible && priceRange ? (
        <View style={styles.filterOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterVisible(false)}
          />
          <View style={styles.filterPanel}>
            <View style={styles.filterPanelInner}>
              <Text style={styles.filterTitle}>Price:</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  value={[
                    selectedMinPrice ?? priceRange.min,
                    selectedMaxPrice ?? priceRange.max,
                  ]}
                  minimumValue={priceRange.min}
                  maximumValue={priceRange.max}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.primary}
                  thumbTintColor={colors.primary}
                  onValueChange={(values) => {
                    if (!Array.isArray(values) || values.length < 2) return;
                    let [minVal, maxVal] = values;
                    if (minVal > maxVal) {
                      const tmp = minVal;
                      minVal = maxVal;
                      maxVal = tmp;
                    }
                    const clampedMin = Math.max(priceRange.min, Math.min(minVal, priceRange.max));
                    const clampedMax = Math.max(clampedMin, Math.min(maxVal, priceRange.max));
                    setSelectedMinPrice(clampedMin);
                    setSelectedMaxPrice(clampedMax);
                  }}
                />
              </View>
              <View style={styles.priceLabelsRow}>
                <Text style={styles.priceLabel}>
                  {selectedMinPrice != null ? `$${selectedMinPrice}` : `$${priceRange.min}`}
                </Text>
                <Text style={styles.priceLabel}>
                  {selectedMaxPrice != null ? `$${selectedMaxPrice}` : `$${priceRange.max}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
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
  filterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-start",
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  filterPanelInner: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 24,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  sliderContainer: {
    width: "100%",
  },
  priceLabelsRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  emptyWrap: {
    flex: 1,
    ...globalStyles.center,
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
  shareCard: {
    ...globalStyles.cardBase,
    position: "absolute",
    left: 16,
    right: 16,
    top: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 0,
    marginVertical: 0,
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
  shareCardCancelText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
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