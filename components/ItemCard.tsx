import React, {useMemo} from "react";
import {Image, Pressable, StyleSheet, Text, View} from "react-native";
import {useRouter} from "expo-router";
import {colors} from "../styles/colors";
import {IMAGE_URL_PREFIX} from "../constant";
import {OrderStatus} from "../types";
import {globalStyles} from "../styles/globalStyles";

export type ItemCardProps = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  category?: string;
  sellerUsername?: string;
  quantity?: number;
  onPress?: () => void;
  orderStatus?: OrderStatus;
};

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function ItemCard(props: ItemCardProps) {
  const {
    id,
    title,
    price,
    imageUrl,
    category,
    sellerUsername,
    onPress,
    orderStatus,
  } = props;

  const router = useRouter();

  const priceText = useMemo(() => formatPrice(price), [price]);

  const displayUrl = useMemo(() => {
    if (!imageUrl) return undefined;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return IMAGE_URL_PREFIX + imageUrl.replace(/^\/+/, "");
  }, [imageUrl]);

  const statusText = useMemo(() => {
    if (!orderStatus) return "";
    if (orderStatus === "placed") return "Placed";
    if (orderStatus === "completed") return "Completed";
    if (orderStatus === "cancelled") return "Cancelled";
    return orderStatus;
  }, [orderStatus]);

  const statusStyle = useMemo(() => {
    if (!orderStatus) return null;
    if (orderStatus === "cancelled")
      return {bg: colors.danger, fg: colors.white, border: colors.danger};
    if (orderStatus === "completed")
      return {bg: colors.background, fg: colors.textPrimary, border: colors.border};
    return {bg: colors.primary, fg: colors.white, border: colors.primary};
  }, [orderStatus]);

  const handlePress = () => {
    if (onPress) onPress();
    else router.push({pathname: "/item/[id]", params: {id}});
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <View style={styles.media}>
          {displayUrl ? (
            <Image source={{uri: displayUrl}} style={styles.image} resizeMode="cover"/>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>

          {(category || sellerUsername) ? (
            <View style={styles.subRow}>
              {category ? (
                <Text numberOfLines={1} style={styles.categoryText}>
                  {category}
                </Text>
              ) : null}
              {sellerUsername ? (
                <Text numberOfLines={1} style={styles.sellerText}>
                  {category ? " · " : ""}@{sellerUsername}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.footerRow}>
            {statusText && statusStyle ? (
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusStyle.bg, borderColor: statusStyle.border},
                ]}
              >
                <Text style={[styles.statusText, {color: statusStyle.fg}]}>
                  {statusText}
                </Text>
              </View>
            ) : null}

            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...globalStyles.cardBase,
    padding: 10,
  },
  cardPressed: {
    ...globalStyles.cardPressed,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  media: {
    ...globalStyles.mediaBase,
    width: 96,
    height: 96,
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
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  sellerText: {
    color: (colors as any).textSecondary || colors.placeholder,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceBadge: {
    ...globalStyles.priceBadge,
    marginLeft: "auto",
  },
  priceText: {
    ...globalStyles.priceText,
  },
  statusBadge: {
    ...globalStyles.statusPill,
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
});