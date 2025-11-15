export type OrderPlacedPayload = {
  order_number: string;
  total_amount?: number;
  created_at?: string;
};
export type OrderStatusPayload = {
  order_number: string;
  status: string;
};