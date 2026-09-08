export type ProductCategory = "Split" | "Central" | "Repuesto";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  btu: number | null;
  price: number | null;
  description: string;
  image: string;
}

export interface QuoteCartItem extends Product {
  quantity: number;
}
