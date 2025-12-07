import React, {useEffect} from "react";
import {Tabs, useRouter, useSegments} from "expo-router";
import {CartProvider} from "../contexts/CartContext";
import {AuthProvider, useAuth} from "../contexts/AuthContext";
import {ProfileProvider} from "../contexts/ProfileContext";
import {ArrowLeft, Package, Store, Tag, User, MessageCircle} from "lucide-react-native";
import {Pressable} from "react-native";
import {colors} from "../styles/colors";
import {PaperProvider} from "react-native-paper";
import {MessageProvider} from "../contexts/MessageContext";
import * as Notifications from "expo-notifications";
import {ensureNotificationSetup} from "../lib/api/notifications";

function AppShell() {
  const {loggedIn, isAuthLoading, user} = useAuth();
  const segments = useSegments();
  const inAuth = segments[0] === "auth";
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthLoading && !loggedIn && !inAuth) {
        router.replace("/auth/login");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [loggedIn, inAuth, isAuthLoading]);

  useEffect(() => {
    ensureNotificationSetup().then();

    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data: any = resp.notification.request.content.data;
      if (data?.action === "open_order" && data.order_number) {
        router.push({
          pathname: "/order/[id]",
          params: {id: String(data.order_number)},
        });
      }
    });

    return () => sub.remove();
  }, [router]);

  if (isAuthLoading) {
    return null;
  }

  function BackButton() {
    const router = useRouter();
    return (
      <Pressable onPress={() => router.back()} style={{paddingHorizontal: 12}}>
        <ArrowLeft size={20} color={colors.textPrimary}/>
      </Pressable>
    );
  }

  return (
    <Tabs screenOptions={{animation: "shift"}} backBehavior="history">
      <Tabs.Screen
        name="auth/login"
        options={{
          title: "Login",
          href: null,
          tabBarStyle: {display: "none"},
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="auth/signup"
        options={{
          title: "Sign Up",
          href: null,
          tabBarStyle: {display: "none"},
          headerShown: false,
        }}
      />
      <Tabs.Screen name="index" options={{
        title: "Market",
        tabBarLabel: "Market",
        tabBarIcon: ({color, size}) => <Store color={color} size={size}/>
      }}/>
       <Tabs.Screen
        name="chat/index"
        options={{
          title: "Chat",
          tabBarLabel: "Chat",
          tabBarIcon: ({color, size}) => <MessageCircle color={color} size={size}/>,
        }}
      />
      <Tabs.Screen name="sell" options={{
        title: "Sell",
        tabBarLabel: "Sell",
        tabBarIcon: ({color, size}) => <Tag color={color} size={size}/>
      }}/>
      <Tabs.Screen
        name="chat/index"
        options={{
          title: "Chat",
          tabBarLabel: "Chat",
          tabBarIcon: ({color, size}) => <MessageCircle color={color} size={size}/>,
      }}/>
      <Tabs.Screen name="order" options={{
        title: "Order",
        tabBarLabel: "Order",
        tabBarIcon: ({color, size}) => <Package color={color} size={size}/>
      }}/>
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({color, size}) => <User color={color} size={size}/>,
        }}
      />

      <Tabs.Screen name="cart" options={{title: "Cart", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="item/[id]" options={{title: "Item Details", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="order/[id]" options={{title: "Order Details", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="chat/[threadId]" options={{title: "Chat", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="settings" options={{title: "Settings", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="profile/edit" options={{title: "Edit Profile", href: null, headerLeft: () => <BackButton/>}}/>
      <Tabs.Screen name="profile/posts" options={{title: "View Posts", href: null, headerLeft: () => <BackButton/>}}/>
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <MessageProvider>
        <AuthProvider>
          <CartProvider>
            <ProfileProvider>
              <AppShell/>
            </ProfileProvider>
          </CartProvider>
        </AuthProvider>
      </MessageProvider>
    </PaperProvider>
  );
}