type CreateOrderItem = {
  product_id: string;
  quantity: number;
};
export type CreateOrderRequest = {
  items: CreateOrderItem[];
  customer_username: string;
};
export type CreateOrderResponse = {
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