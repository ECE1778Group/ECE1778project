import {Redirect, Tabs, useSegments} from "expo-router";
import {CartProvider} from "../contexts/CartContext";
import {AuthProvider, useAuth} from "../contexts/AuthContext";

function AppShell() {
  const {isAuthenticated, skipped} = useAuth();
  const segments = useSegments();
  const inAuth = segments[0] === "auth";

  if (!isAuthenticated && !skipped && !inAuth) {
    return <Redirect href="/auth/login"/>;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="auth/login"
        options={{
          title: "Login",
          href: null,
          tabBarLabel: () => null,
          tabBarStyle: {display: "none"},
          headerShown: false
        }}
      />

      <Tabs.Screen name="index" options={{title: "Market", tabBarLabel: "Market"}}/>
      <Tabs.Screen name="cart" options={{title: "Cart", tabBarLabel: "Cart"}}/>
      <Tabs.Screen name="item/[id]" options={{title: "Item Information", href: null, tabBarLabel: () => null}}/>
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell/>
      </CartProvider>
    </AuthProvider>
  );
}