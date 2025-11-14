// lib/api/order.ts
import { useCallback } from "react";
import { useFetch } from "./fetch-client";
import { notifyOrderStatus } from "./notifications";
import { OrderStatus } from "../../types";

type CreateOrderItem = {
  product_id: string;
  quantity: number;
};

type CreateOrderRequest = {
  items: CreateOrderItem[];
  customer_username: string;
};

type CreateOrderResponse = {
  order_number: string;
  customer_username: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderSummaryDto = {
  order_number: string;
  customer_username: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderItemDto = {
  order_number: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
};

export type OrderDetailDto = {
  order_number: string;
  items: OrderItemDto[];
  customer_username: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

function normalizeStatus(raw: string): OrderStatus {
  const v = raw.toLowerCase();
  if (v === "completed") return "completed";
  if (v === "cancelled") return "cancelled";
  return "placed";
}

export function deriveOrderStatusFromItems(items: { status: string }[]): OrderStatus {
  if (!items || items.length === 0) return "placed";
  const statuses = items.map((it) => normalizeStatus(String(it.status)));
  const nonCancelled = statuses.filter((s) => s !== "cancelled");
  if (nonCancelled.length === 0) return "cancelled";
  if (nonCancelled.includes("placed")) return "placed";
  return "completed";
}

const memoryStore = new Map<string, OrderStatus>();

export function getOrderStatus(orderNumber: string, fallback: OrderStatus = "placed"): OrderStatus {
  return memoryStore.get(orderNumber) ?? fallback;
}

export async function setOrderStatus(orderNumber: string, status: OrderStatus) {
  memoryStore.set(orderNumber, status);
  await notifyOrderStatus({ order_number: orderNumber, status });
}

export function useOrderApi() {
  const { getData, postData } = useFetch();

  const createOrder = useCallback(
    async (body: CreateOrderRequest): Promise<CreateOrderResponse> => {
      const data = await postData("/api/order/", body);
      const created = data as CreateOrderResponse;
      await setOrderStatus(created.order_number, "placed");
      return created;
    },
    [postData]
  );

  const listOrders = useCallback(
    async (): Promise<OrderSummaryDto[]> => {
      const data = await getData("/api/order/");
      return (Array.isArray(data) ? data : []) as OrderSummaryDto[];
    },
    [getData]
  );

  const getOrder = useCallback(
    async (orderNumber: string): Promise<OrderDetailDto | null> => {
      const endpoint = `/api/order/${encodeURIComponent(orderNumber)}/`;
      try {
        const data = await getData(endpoint);
        return data as OrderDetailDto;
      } catch (e: any) {
        const msg = (e && e.message ? String(e.message) : "").toLowerCase();
        if (msg.includes("not found") || msg.includes("404")) {
          return null;
        }
        throw e;
      }
    },
    [getData]
  );

  return { createOrder, listOrders, getOrder };
}