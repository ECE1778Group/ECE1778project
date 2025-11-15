import {OrderStatus} from "../types";

export interface NotificationPayload {
  id: number;
  created_at: string;
  type: string;
  data: OrderPlacedPayload | OrderStatusPayload | null;
}

export interface OrderPlacedPayload {
  order_number: string;
  total_amount?: number;
  created_at?: string;
}

export interface OrderStatusPayload {
  order_number: string;
  status: OrderStatus;
}