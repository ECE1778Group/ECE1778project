import { useFetch } from "./fetch-client";

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

  return { searchProducts };
};