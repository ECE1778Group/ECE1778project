import { useFetch } from "./fetch-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constant";

type ProductDTO = {
  id: string;
  title: string;
  description?: string;
  price: number;
  picture_url?: string;
  category?: string;
  seller_username?: string;
  quantity?: number;
};

export const useProductApi = () => {
  const { getData } = useFetch();

  const searchProducts = async (keyword: string) => {
    const q = keyword.trim();
    if (!q) return [];
    try {
      const res = await getData(`/api/product/search/?keyword=${encodeURIComponent(q)}`);
      return (res ?? []) as ProductDTO[];
    } catch (e: any) {
      if (e?.status === 404) return [];
      return [];
    }
  };

  const addProduct = async (form: FormData) => {
    const token = await AsyncStorage.getItem("access");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/api/product/`, {
      method: "POST",
      headers,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || data?.message || "Request failed";
      const err: any = new Error(msg);
      (err.status = res.status);
      throw err;
    }
    return data;
  };

  return { searchProducts, addProduct };
};