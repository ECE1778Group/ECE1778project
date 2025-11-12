import { BASE_URL } from "../../constant";

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

export function useOrderApi() {
  const createOrder = async (
    body: CreateOrderRequest
  ): Promise<CreateOrderResponse> => {
    const res = await fetch(`${BASE_URL}/api/order/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore parse error, will throw generic message below
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Failed to create order (${res.status})`;
      throw new Error(msg);
    }

    return data as CreateOrderResponse;
  };

  return { createOrder };
}