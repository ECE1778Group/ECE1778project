import * as Notifications from "expo-notifications";
import {Platform} from "react-native";

type OrderPlacedPayload = {
  order_number: string;
  total_amount?: number;
  created_at?: string;
};

type OrderStatusPayload = {
  order_number: string;
  status: string;
};

let initialized = false;

export async function ensureNotificationSetup() {
  if (initialized) return;
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const {status} = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [100, 100],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function notifyOrderPlaced(data: OrderPlacedPayload) {
  await ensureNotificationSetup();
  const amount =
    typeof data.total_amount === "number"
      ? `$${Number(data.total_amount).toFixed(
        Number(data.total_amount) % 1 === 0 ? 0 : 2
      )}`
      : "";
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Order placed",
      body: `#${data.order_number} ${amount}`,
      data: {
        action: "open_order",
        order_number: data.order_number,
        total_amount: data.total_amount ?? null,
      },
    },
    trigger: null,
  });
}

export async function notifyOrderStatus(data: OrderStatusPayload) {
  await ensureNotificationSetup();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Order status updated",
      body: `#${data.order_number} → ${data.status}`,
      data: {
        action: "open_order",
        order_number: data.order_number,
        status: data.status,
      },
    },
    trigger: null,
  });
}