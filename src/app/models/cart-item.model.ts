
export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string | null;
  flavor?: string | null;
  presentation?: string | null;
  price: number;
  quantity: number;
  imageUrl: string;
}
