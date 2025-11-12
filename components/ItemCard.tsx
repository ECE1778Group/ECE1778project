// components/ItemCard.tsx
import React, {useMemo} from "react";
import {Image, Pressable, StyleSheet, Text, View} from "react-native";
import {useRouter} from "expo-router";
import {colors} from "../styles/colors";
import {IMAGE_URL_PREFIX} from "../constant";

export type ItemCardProps = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  distanceKm?: number;
  courseCode?: string;
  createdAt?: string | number | Date;
  onPress?: () => void;
};

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

function formatTimeAgo(d?: string | number | Date) {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (!isFinite(t)) return "";
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export default function ItemCard(props: ItemCardProps) {
  const {id, title, price, imageUrl, distanceKm, courseCode, createdAt, onPress} = props;
  const router = useRouter();
  const timeAgo = useMemo(() => formatTimeAgo(createdAt), [createdAt]);
  const priceText = useMemo(() => formatPrice(price), [price]);
  const distanceText = useMemo(() => (distanceKm != null ? `${distanceKm.toFixed(1)} km` : ""), [distanceKm]);
  const displayUrl = useMemo(() => {
    if (!imageUrl) return undefined;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return IMAGE_URL_PREFIX + imageUrl.replace(/^\/+/, "");
  }, [imageUrl]);

  const handlePress = () => {
    if (onPress) onPress();
    else router.push({pathname: "/item/[id]", params: {id}});
  };

  return (
    <Pressable onPress={handlePress} style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
               accessibilityRole="button">
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
          <Text numberOfLines={2} style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            {courseCode ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{courseCode}</Text>
              </View>
            ) : null}
            {distanceText ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{distanceText}</Text>
              </View>
            ) : null}
            {timeAgo ? (
              <View style={styles.tagMuted}>
                <Text style={styles.tagMutedText}>Listed {timeAgo} ago</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.footerRow}>
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
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  cardPressed: {
    transform: [{scale: 0.99}],
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  media: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  imagePlaceholderText: {
    color: colors.placeholder,
    fontSize: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
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
  tagMuted: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagMutedText: {
    color: colors.placeholder,
    fontSize: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  ctaText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});