
import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { Footer } from '../../components/footer/footer';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

import { Header } from '../../components/header/header';
import { Products } from '../../services/products';
import { Cart } from '../../services/cart';
import { ProductVariant } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    Header,
    RouterLink,
    CurrencyPipe,
    Footer
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetail {

  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(Products);
  private readonly cart = inject(Cart);

  loading = this.productsService.loading;
  error = this.productsService.error;

  private readonly slug = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('slug'))
    ),
    {
      initialValue: this.route.snapshot.paramMap.get('slug')
    }
  );

  product = computed(() =>
    this.productsService.products().find(
      item =>
        item.slug === this.slug() &&
        item.active
    )
  );

  selectedVariantId = signal<string | null>(null);
  selectedImageIndex = signal(0);
  quantity = signal(1);

  // Incluye variantes agotadas
  variants = computed(() =>
    this.product()?.variants ?? []
  );

  selectedVariant = computed(() =>
    this.variants().find(
      variant =>
        variant.id === this.selectedVariantId()
    ) ??
    this.variants().find(
      variant => variant.available
    ) ??
    this.variants()[0]
  );

  images = computed(() =>
    [...(this.selectedVariant()?.images ?? [])]
      .sort((a, b) => a.position - b.position)
  );

  currentImage = computed(() =>
    this.images()[this.selectedImageIndex()]
    ?? this.images()[0]
  );

  availableStock = computed(() =>
    this.selectedVariant()?.stock ?? 0
  );

  // Cantidad de esta variante ya agregada
  quantityInCart = computed(() => {
    const product = this.product();
    const variant = this.selectedVariant();

    if (!product || !variant) return 0;

    return this.cart.getQuantity(
      product.id,
      variant.id
    );
  });

  // Unidades adicionales que se pueden agregar
  remainingStock = computed(() =>
    Math.max(
      0,
      this.availableStock() - this.quantityInCart()
    )
  );

  canAddToCart = computed(() =>
    !!this.product() &&
    !!this.selectedVariant()?.available &&
    this.remainingStock() >= this.quantity()
  );

  selectVariant(variant: ProductVariant): void {
    this.selectedVariantId.set(variant.id);
    this.selectedImageIndex.set(0);
    this.quantity.set(1);
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

  increaseQuantity(): void {
    this.quantity.update(value =>
      Math.min(
        value + 1,
        Math.max(1, this.remainingStock())
      )
    );
  }

  decreaseQuantity(): void {
    this.quantity.update(value =>
      Math.max(1, value - 1)
    );
  }

  addToCart(): void {
    const product = this.product();
    const variant = this.selectedVariant();

    if (!product || !variant || !this.canAddToCart()) {
      return;
    }

    for (let i = 0; i < this.quantity(); i++) {
      this.cart.addItem(product, variant);
    }

    this.quantity.set(1);
  }

  async refreshProduct(): Promise<void> {
    await this.productsService.loadProducts();
  }
}
