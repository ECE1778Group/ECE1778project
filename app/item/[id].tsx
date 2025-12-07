import React, {useEffect, useRef, useState} from "react";
import {Alert, Animated, Easing, Image, Pressable, ScrollView, Share, StyleSheet, Text, View,} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import * as Clipboard from "expo-clipboard";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import {MarketplaceItem} from "../../types";
import {useCart} from "../../contexts/CartContext";
import CartFab from "../../components/CartFab";
import {Share2} from "lucide-react-native";
import {useProductApi} from "../../lib/api/product";
import {IMAGE_URL_PREFIX} from "../../constant";
import {useAuth} from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constant";
import { useFetch } from "../../lib/api/fetch-client";

type LocalItem = MarketplaceItem & { description?: string };

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function ItemDetail() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {add} = useCart();
  const {getProduct} = useProductApi();

  const {user} = useAuth();
  const { postData, loading: creatingThread } = useFetch();

  const [item, setItem] = useState<LocalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reqVer = useRef(0);
  const isSellerSelf = item?.sellerUsername === user?.username;

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
        createdAt: undefined,
        category: dto.category as string,
        sellerUsername: dto.seller_username as string,
        stock: typeof dto.quantity === "number" ? dto.quantity : undefined,
        description: dto.description || undefined,
      };

      setItem(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, getProduct]);

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

  const shareItem = async () => {
    if (!item) return;

    const shareText =
      `UT Reuse item\n` +
      `Title: ${item.title}\n` +
      `Item ID: ${item.id}\n` +
      `Price: ${formatPrice(item.price)}\n`;

    try {
      await Clipboard.setStringAsync(shareText);
      await Share.share({message: shareText});
    } catch {
      Alert.alert("Failed", "Unable to share this item.");
    }
  };

  const contactSeller = async () => {
    if (!item) return;

    try {
      const data = await postData("/api/chat/thread/", {
        peer_username: item.sellerUsername,
      });
      const threadId = String(data.id);
      console.log("thread: " + threadId)
      router.push({
        pathname: "/chat/[threadId]",
        params: {
          threadId,
          peerUsername: item.sellerUsername,
        },
      });
    } catch (e: any) {
      console.log("contactSeller error", e?.message);
    }
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

  return (
    <View style={globalStyles.container}>
      <View style={styles.shareWrapper}>
        <Pressable
          onPress={shareItem}
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel="Share item"
        >
          <Share2 size={24} color={colors.textPrimary}/>
        </Pressable>
      </View>

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
          {item.stock != null ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Stock {item.stock}</Text>
            </View>
          ) : null}

          {item.sellerUsername ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Seller {item.sellerUsername}</Text>
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
          style={[styles.contactBtn, isSellerSelf && { opacity: 0.5 }]}
          onPress={contactSeller}
          accessibilityRole="button"
          accessibilityLabel="Contact seller"
          disabled={isSellerSelf}
        >
          <Text style={styles.contactText}>
            {isSellerSelf ? "You are the seller" : "Chat"}
          </Text>
        </Pressable>
      </View>


      <View ref={fabRef} style={styles.fabWrapper}>
        <CartFab/>
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
    ...globalStyles.imagePlaceholder,
  },
  imagePlaceholderText: {
    ...globalStyles.imagePlaceholderText,
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
    ...globalStyles.tag,
  },
  tagText: {
    ...globalStyles.tagText,
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
    ...globalStyles.footerBar,
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
  flyImage: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  shareWrapper: {
    position: "absolute",
    right: 16,
    top: 10,
    zIndex: 2,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
});
