import {Redirect, Tabs, useSegments} from "expo-router";
import {CartProvider} from "../contexts/CartContext";
import {AuthProvider, useAuth} from "../contexts/AuthContext";
import {ProfileProvider} from "../contexts/ProfileContext";
import {Package, Store, Tag, User} from "lucide-react-native";

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

      <Tabs.Screen name="index" options={{
        title: "Market",
        tabBarLabel: "Market",
        tabBarIcon: ({color, size}) => <Store color={color} size={size}/>
      }}/>
      <Tabs.Screen name="sell" options={{
        title: "Sell",
        tabBarLabel: "Sell",
        tabBarIcon: ({color, size}) => <Tag color={color} size={size}/>
      }}/>
      <Tabs.Screen name="order" options={{
        title: "Order",
        tabBarLabel: "Order",
        tabBarIcon: ({color, size}) => <Package color={color} size={size}/>
      }}/>
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarLabel: "Profile",
        tabBarIcon: ({color, size}) => <User color={color} size={size}/>
      }}/>

      <Tabs.Screen name="cart" options={{title: "Cart", href: null}}/>
      <Tabs.Screen name="item/[id]" options={{title: "Item Details", href: null}}/>
      <Tabs.Screen name="order/[id]" options={{title: "Order Details", href: null}}/>
      <Tabs.Screen name="chat/[threadId]" options={{title: "Chat", href: null}}/>

      <Tabs.Screen name="settings" options={{title: "Settings", href: null}}/>
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <ProfileProvider>
          <AppShell/>
        </ProfileProvider>
      </CartProvider>
    </AuthProvider>
  );
}