import React, {useMemo, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, View, Alert} from "react-native";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import CartItem from "../components/CartItemCard";
import {useCart} from "../contexts/CartContext";
import {useAuth} from "../contexts/AuthContext";
import {useOrderApi} from "../lib/api/order";

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
      const totalDisplay =
        typeof resp?.total_amount === "number"
          ? `$${Number(resp.total_amount).toFixed(
              Number(resp.total_amount) % 1 === 0 ? 0 : 2
            )}`
          : "";
      Alert.alert(
        "Order Placed",
        `Order #: ${resp.order_number}\nTotal: ${totalDisplay}`
      );
      clear();
    } catch (err: any) {
      Alert.alert("Checkout failed", err?.message || "Unable to create order.");
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
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: colors.placeholder,
    fontSize: 16,
  },
});