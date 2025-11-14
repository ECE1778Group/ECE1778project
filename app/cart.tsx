import React, {useMemo, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, View} from "react-native";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import CartItem from "../components/CartItemCard";
import {useCart} from "../contexts/CartContext";
import {useAuth} from "../contexts/AuthContext";
import {useOrderApi} from "../lib/api/order";
import {notifyOrderPlaced} from "../lib/api/notifications";

export default function Cart() {
  const {entries, changeQuantity, remove, clear, total} = useCart();
  const {user} = useAuth();
  const {createOrder} = useOrderApi();

  const [placing, setPlacing] = useState(false);

  const hasItems = entries.length > 0;
  const totalText = useMemo(() => {
    if (total <= 0) return "$0";
    return `$${total.toFixed(total % 1 === 0 ? 0 : 2)}`;
  }, [total]);

  const checkout = async () => {
    if (!hasItems || placing) return;
    try {
      setPlacing(true);
      const payloadItems = entries.map((e) => ({
        product_id: e.id,
        quantity: e.quantity,
      }));
      const resp = await createOrder({
        items: payloadItems,
        customer_username: user?.username || "Guest",
      });

      await notifyOrderPlaced({
        order_number: resp.order_number,
        total_amount: resp.total_amount,
        created_at: resp.created_at,
      });

      clear();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      {hasItems ? (
        <>
          <FlatList
            data={entries}
            keyExtractor={(it) => it.id}
            renderItem={({item}) => (
              <CartItem
                id={item.id}
                price={item.price}
                imageUrl={item.imageUrl}
                distanceKm={item.distanceKm}
                quantity={item.quantity}
                maxQuantity={item.maxQuantity}
                onChangeQuantity={changeQuantity}
                onRemove={remove}
              />
            )}
            contentContainerStyle={{paddingVertical: 8, paddingBottom: 88}}
          />
          <View style={styles.footer}>
            <Text style={styles.totalText}>{totalText}</Text>
            <Pressable style={styles.clearBtn} onPress={clear}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable
              style={[styles.checkoutBtn, (!hasItems || placing) && styles.checkoutBtnDisabled]}
              onPress={checkout}
              disabled={!hasItems || placing}
            >
              <Text style={styles.checkoutText}>{placing ? "Placing..." : "Checkout"}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Cart is empty</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    ...globalStyles.footerBar,
    alignItems: "center",
    gap: 10,
  },
  totalText: {
    marginRight: "auto",
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  clearBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clearText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  empty: {
    flex: 1,
    ...globalStyles.center,
  },
  emptyText: {
    color: colors.placeholder,
    fontSize: 16,
  },
});