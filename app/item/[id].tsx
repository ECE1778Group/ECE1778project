// app/item/[id].tsx
import React, {useEffect, useRef, useState} from "react";
import {Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import {MarketplaceItem} from "../../types";
import {useCart} from "../../contexts/CartContext";
import {ShoppingCart} from "lucide-react-native";
import {useProductApi} from "../../lib/api/product";
import {IMAGE_URL_PREFIX} from "../../constant";

type LocalItem = MarketplaceItem & { description?: string };

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function ItemDetail() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {add, count} = useCart();
  const {getProduct} = useProductApi();

  const [item, setItem] = useState<LocalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reqVer = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const current = ++reqVer.current;

    setLoading(true);
    setNotFound(false);

    (async () => {
      const dto = await getProduct(String(id));
      if (cancelled || current !== reqVer.current) return;

      if (!dto) {
        setItem(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const cat = String(dto.category ?? "").toLowerCase();
      const isBook = cat.includes("book");
      let picture = dto.picture_url || "";
      if (picture && !/^https?:\/\//i.test(picture)) {
        picture = IMAGE_URL_PREFIX + picture.replace(/^\/+/, "");
      }

      const mapped: LocalItem = {
        id: String(dto.id),
        kind: isBook ? "book" : "other",
        title: String(dto.title),
        price: Number(dto.price) || 0,
        imageUrl: picture || undefined,
        distanceKm: undefined,
        courseCode: undefined,
        createdAt: undefined,
        stock: typeof dto.quantity === "number" ? dto.quantity : undefined,
        category: isBook ? undefined : (dto.category as string | undefined),
        authors: undefined,
        isbn: undefined,
        description: dto.description || undefined,
      };

      setItem(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const imgBoxRef = useRef<View>(null);
  const fabRef = useRef<View>(null);
  const [flyVisible, setFlyVisible] = useState(false);
  const [flyUri, setFlyUri] = useState<string | undefined>(undefined);
  const flyXY = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(1)).current;

  const startFly = () => {
    if (!item) return;
    if (!imgBoxRef.current || !fabRef.current) {
      add(item, 1);
      return;
    }
    imgBoxRef.current.measureInWindow((ix, iy, iw, ih) => {
      fabRef.current?.measureInWindow((fx, fy, fw, fh) => {
        const startX = ix + iw / 2 - 32;
        const startY = iy + ih / 2 - 32;
        const endX = fx + fw / 2 - 24;
        const endY = fy + fh / 2 - 24;
        flyXY.setValue({x: startX, y: startY});
        flyScale.setValue(1);
        flyOpacity.setValue(1);
        setFlyUri(item.imageUrl);
        setFlyVisible(true);
        add(item, 1);
        Animated.parallel([
          Animated.timing(flyXY, {
            toValue: {x: endX, y: endY},
            duration: 550,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false
          }),
          Animated.timing(flyScale, {
            toValue: 0.5,
            duration: 550,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false
          }),
          Animated.timing(flyOpacity, {toValue: 0.1, duration: 550, easing: Easing.linear, useNativeDriver: false}),
        ]).start(() => {
          setFlyVisible(false);
        });
      });
    });
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, {alignItems: "center", justifyContent: "center"}]}>
        <Text style={{color: colors.textPrimary, fontSize: 16}}>Loading...</Text>
      </View>
    );
  }

  if (notFound || !item) {
    return (
      <View style={[globalStyles.container, {alignItems: "center", justifyContent: "center"}]}>
        <Text style={{color: colors.textPrimary, fontSize: 16}}>Not found</Text>
      </View>
    );
  }

  const filled = count > 0;

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View ref={imgBoxRef} style={styles.mediaBox}>
          {item.imageUrl ? (
            <Image source={{uri: item.imageUrl}} style={styles.image} resizeMode="cover"/>
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
          {item.stock != null ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Stock {item.stock}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.bodyText}>{item.description || "No description"}</Text>
      </ScrollView>

      {flyVisible && flyUri ? (
        <Animated.Image
          source={{uri: flyUri}}
          style={[
            styles.flyImage,
            {
              left: flyXY.x,
              top: flyXY.y,
              transform: [{scale: flyScale}],
              opacity: flyOpacity,
            },
          ]}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.actionBar}>
        <Pressable
          style={styles.cartBtn}
          onPress={startFly}
          accessibilityRole="button"
          accessibilityLabel="Add to cart"
        >
          <Text style={styles.actionText}>Add to Cart</Text>
        </Pressable>
        <Pressable
          style={styles.contactBtn}
          onPress={() => router.push({pathname: "/chat/[threadId]", params: {threadId: String(id)}})}
          accessibilityRole="button"
          accessibilityLabel="Contact seller"
        >
          <Text style={styles.contactText}>Contact Seller</Text>
        </Pressable>
      </View>

      <View ref={fabRef} style={styles.fabWrapper}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
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
  contactBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  contactText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  fabWrapper: {
    position: "absolute",
    right: 18,
    bottom: 96,
  },
  fab: {
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
  flyImage: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 8,
  },
});