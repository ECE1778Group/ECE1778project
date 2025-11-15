// Market Items
export type ID = string;

export type BaseItem = {
  id: ID;
  title: string;
  price: number;
  imageUrl?: string;
  createdAt?: string | number | Date;
  category: string;
  sellerUsername: string;
  stock?: number;
};

export type BookItem = BaseItem & {
  kind: "book";
};

export type OtherItem = BaseItem & {
  kind: "other";
  category?: string;
};

export type ItemMap = {
  book: BookItem;
  other: OtherItem;
};

export type MarketplaceItem = ItemMap[keyof ItemMap];
export type ItemKind = keyof ItemMap;

export type OrderStatus = "placed" | "completed" | "cancelled";
