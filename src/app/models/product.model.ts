
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  size: string | null;
  flavor?: string | null;
  presentation?: string | null;
  available: boolean;
  stock?: number;
  images: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categorySlug: string;
  active: boolean;
  variants: ProductVariant[];
}
