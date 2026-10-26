
import {
  Injectable,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import {
  Product,
  ProductVariant
} from '../models/product.model';

import { CartItem } from '../models/cart-item.model';
import { Products } from './products';

@Injectable({
  providedIn: 'root'
})
export class Cart {

  private readonly storageKey = 'allea-shopping-cart';
  private readonly productsService = inject(Products);

  private itemsState = signal<CartItem[]>(
    this.loadCart()
  );

  items = this.itemsState.asReadonly();

  totalItems = computed(() =>
    this.items().reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

  totalPrice = computed(() =>
    this.items().reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    )
  );

  constructor() {
    effect(() => {
      const items = this.itemsState();

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            this.storageKey,
            JSON.stringify(items)
          );
        } catch {
          // El carrito continúa funcionando en memoria.
        }
      }
    });
  }

  // ==========================================
  // RECUPERAR CARRITO
  // ==========================================

  private loadCart(): CartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const saved = localStorage.getItem(
        this.storageKey
      );

      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed.filter(
            (item): item is CartItem =>
              item !== null &&
              typeof item === 'object' &&
              typeof item.productId === 'string' &&
              typeof item.variantId === 'string' &&
              typeof item.quantity === 'number' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              typeof item.price === 'number' &&
              Number.isFinite(item.price)
          )
        : [];

    } catch {
      return [];
    }
  }

  // ==========================================
  // CONSULTAR STOCK ACTUAL
  // ==========================================

  private getAvailableStock(
    productId: string,
    variantId: string
  ): number {

    const product = this.productsService.products()
      .find(item => item.id === productId && item.active);

    const variant = product?.variants.find(
      item => item.id === variantId
    );

    if (!variant || !variant.available) {
      return 0;
    }

    return Math.max(0, variant.stock ?? 0);
  }

  // ==========================================
  // AGREGAR AL CARRITO
  // ==========================================

  addItem(
    product: Product,
    variant: ProductVariant
  ): void {

    if (!variant.available) return;

    const stock = this.getAvailableStock(
      product.id,
      variant.id
    );

    if (stock <= 0) return;

    this.itemsState.update(items => {

      const existing = items.find(item =>
        item.productId === product.id &&
        item.variantId === variant.id
      );

      if (existing) {

        if (existing.quantity >= stock) {
          return items;
        }

        return items.map(item =>
          item.productId === product.id &&
          item.variantId === variant.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  stock
                )
              }
            : item
        );
      }

      return [
        ...items,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          color: variant.color,
          size: variant.size,
          flavor: variant.flavor,
          presentation: variant.presentation,
          price: product.price,
          quantity: 1,
          imageUrl: variant.images[0]?.url ?? ''
        }
      ];
    });
  }

  // ==========================================
  // AUMENTAR CANTIDAD
  // ==========================================

  increase(
    productId: string,
    variantId: string
  ): void {

    const stock = this.getAvailableStock(
      productId,
      variantId
    );

    if (stock <= 0) return;

    this.itemsState.update(items =>
      items.map(item =>
        item.productId === productId &&
        item.variantId === variantId
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                stock
              )
            }
          : item
      )
    );
  }

  // ==========================================
  // DISMINUIR CANTIDAD
  // ==========================================

  decrease(
    productId: string,
    variantId: string
  ): void {

    this.itemsState.update(items =>
      items
        .map(item =>
          item.productId === productId &&
          item.variantId === variantId
            ? {
                ...item,
                quantity: item.quantity - 1
              }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  remove(
    productId: string,
    variantId: string
  ): void {

    this.itemsState.update(items =>
      items.filter(item =>
        !(
          item.productId === productId &&
          item.variantId === variantId
        )
      )
    );
  }

  // ==========================================
  // VACIAR CARRITO
  // ==========================================

  clear(): void {
    this.itemsState.set([]);
  }

  // ==========================================
  // STOCK PARA COMPONENTES
  // ==========================================

  getStock(
    productId: string,
    variantId: string
  ): number {
    return this.getAvailableStock(
      productId,
      variantId
    );
  }

  getQuantity(
    productId: string,
    variantId: string
  ): number {

    return this.items().find(item =>
      item.productId === productId &&
      item.variantId === variantId
    )?.quantity ?? 0;
  }

  canIncrease(
    productId: string,
    variantId: string
  ): boolean {

    return this.getQuantity(productId, variantId) <
      this.getAvailableStock(productId, variantId);
  }
}
