import {Tabs} from "expo-router";
import {CartProvider} from "../contexts/CartContext";

export default function RootLayout() {
  return (
    <CartProvider>
      <Tabs>
        <Tabs.Screen name="index" options={{title: "Market", tabBarLabel: "Market"}}/>
        <Tabs.Screen name="cart" options={{title: "Cart", tabBarLabel: "Cart"}}/>
        <Tabs.Screen name="item/[id]" options={{title: "Item Information", href: null, tabBarLabel: () => null}}/>
      </Tabs>
    </CartProvider>
  );
}