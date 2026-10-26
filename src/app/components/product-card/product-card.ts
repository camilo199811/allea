
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import {
  Product,
  ProductVariant
} from '../../models/product.model';

import { Cart } from '../../services/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {

  private readonly cart = inject(Cart);

  product = input.required<Product>();
  variant = input<ProductVariant | undefined>();

  selectedVariantId = signal<string | null>(null);
  selectedImageIndex = signal(0);

  constructor() {
    effect(() => {
      const preferred = this.variant();

      this.selectedVariantId.set(
        preferred?.id ?? null
      );

      this.selectedImageIndex.set(0);
    });
  }

  // Mostrar TODAS las variantes, incluidas las agotadas
  availableVariants = computed(() =>
    this.product().variants
  );

  selectedVariant = computed(() =>
    this.availableVariants().find(
      variant =>
        variant.id === this.selectedVariantId()
    ) ??
    this.variant() ??
    this.availableVariants().find(
      variant => variant.available
    ) ??
    this.availableVariants()[0]
  );

  // Estado de inventario
  isSoldOut = computed(() =>
    !this.selectedVariant()?.available
  );

  // Stock restante, teniendo en cuenta el carrito
  remainingStock = computed(() => {
    const selected = this.selectedVariant();

    if (!selected || !selected.available) {
      return 0;
    }

    const stock = selected.stock ?? 0;

    const quantityInCart = this.cart.getQuantity(
      this.product().id,
      selected.id
    );

    return Math.max(0, stock - quantityInCart);
  });

  canAddToCart = computed(() =>
    !!this.selectedVariant()?.available &&
    this.remainingStock() > 0
  );

  images = computed(() =>
    [...(this.selectedVariant()?.images ?? [])]
      .sort((a, b) => a.position - b.position)
  );

  currentImage = computed(() =>
    this.images()[this.selectedImageIndex()]
    ?? this.images()[0]
  );

  selectVariant(variant: ProductVariant): void {
    this.selectedVariantId.set(variant.id);
    this.selectedImageIndex.set(0);
  }

  selectImage(index: number): void {
    if (
      index >= 0 &&
      index < this.images().length
    ) {
      this.selectedImageIndex.set(index);
    }
  }

  nextImage(): void {
    const total = this.images().length;

    if (total < 2) return;

    this.selectedImageIndex.update(
      index => (index + 1) % total
    );
  }

  previousImage(): void {
    const total = this.images().length;

    if (total < 2) return;

    this.selectedImageIndex.update(
      index => (index - 1 + total) % total
    );
  }

  addToCart(): void {
    const selected = this.selectedVariant();

    if (!selected || !this.canAddToCart()) {
      return;
    }

    this.cart.addItem(
      this.product(),
      selected
    );
  }
}
