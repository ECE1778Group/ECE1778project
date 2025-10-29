import React, {useMemo} from "react";
import {Image, Pressable, StyleSheet, Text, View} from "react-native";
import {colors} from "../styles/colors";
import {Minus, Plus, Trash2} from "lucide-react-native";

export type CartItemProps = {
  id: string;
  price: number;
  imageUrl?: string;
  distanceKm?: number;
  quantity: number;
  maxQuantity: number;
  onChangeQuantity?: (id: string, qty: number) => void;
  onRemove?: (id: string) => void;
};

function formatPrice(n: number) {
  if (!isFinite(n)) return "";
  if (n <= 0) return "Free";
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export default function CartItem(props: CartItemProps) {
  const {id, price, imageUrl, distanceKm, quantity, maxQuantity, onChangeQuantity, onRemove} = props;

  const qty = useMemo(() => Math.max(0, Math.min(quantity, Math.max(1, maxQuantity))), [quantity, maxQuantity]);
  const priceText = useMemo(() => formatPrice(price), [price]);
  const distanceText = useMemo(() => (distanceKm != null ? `${distanceKm.toFixed(1)} km` : ""), [distanceKm]);

  const dec = () => {
    const next = qty - 1;
    if (next <= 0) {
      onRemove?.(id);
      return;
    }
    onChangeQuantity?.(id, next);
  };

  const inc = () => {
    if (qty >= maxQuantity) return;
    onChangeQuantity?.(id, qty + 1);
  };

  const remove = () => onRemove?.(id);

  const incDisabled = qty >= maxQuantity;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.media}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.image} resizeMode="cover"/>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.topRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
            {distanceText ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{distanceText}</Text>
              </View>
            ) : null}
            <Pressable onPress={remove} style={styles.removeBtn} accessibilityRole="button"
                       accessibilityLabel="Remove from cart">
              <Trash2 size={18} color={colors.danger}/>
            </Pressable>
          </View>

          <View style={styles.qtyRow}>
            <Pressable onPress={dec} style={styles.qtyBtn} accessibilityRole="button"
                       accessibilityLabel="Decrease quantity">
              <Minus size={18} color={colors.textPrimary}/>
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable
              onPress={inc}
              style={[styles.qtyBtn, incDisabled && styles.qtyBtnDisabled]}
              disabled={incDisabled}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Plus size={18} color={incDisabled ? colors.placeholder : colors.textPrimary}/>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
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
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  media: {
    width: 80,
    height: 80,
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
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
  removeBtn: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyText: {
    minWidth: 24,
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});