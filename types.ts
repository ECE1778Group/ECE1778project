// Market Items
export type ID = string;

export type BaseItem = {
  id: ID;
  title: string;
  price: number;
  imageUrl?: string;
  distanceKm?: number;
  createdAt?: string | number | Date;
  courseCode?: string;
  stock?: number;
};

export type BookItem = BaseItem & {
  kind: "book";
  isbn?: string;
  authors?: string[];
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