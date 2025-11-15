export type ProductDTO = {
  id: string;
  title: string;
  description?: string;
  price: number;
  picture_url?: string;
  category?: string;
  seller_username?: string;
  quantity?: number;
};
export type CreateProductDTO = {
  title: string;
  description: string;
  price: number;
  picture_url: string;
  category: string;
  quantity: number;
};