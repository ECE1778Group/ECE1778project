import React from "react";
import {Pressable, StyleSheet} from "react-native";
import {useRouter} from "expo-router";
import {ShoppingCart} from "lucide-react-native";
import {colors} from "../styles/colors";
import {useCart} from "../contexts/CartContext";

type Props = {
  style?: any;
};

export default function CartFab({style}: Props) {
  const router = useRouter();
  const {count} = useCart();
  const filled = count > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open cart"
      onPress={() => router.push("/cart")}
      style={({pressed}) => [
        styles.fab,
        filled ? styles.fabFilled : styles.fabEmpty,
        pressed && styles.fabPressed,
        style,
      ]}
    >
      <ShoppingCart size={22} color={filled ? colors.white : colors.primary}/>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});