
import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { Categories } from '../../services/categories';
import { Products } from '../../services/products';

import {
  Product,
  ProductVariant
} from '../../models/product.model';

import { ProductCard } from '../product-card/product-card';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [ProductCard],
  templateUrl: './product-catalog.html',
  styleUrl: './product-catalog.scss'
})
export class ProductCatalog {

  private readonly categoriesService = inject(Categories);
  private readonly productsService = inject(Products);

  // ==========================================
  // ESTADO DE LOS FILTROS
  // ==========================================

  selectedCategory = this.categoriesService.selectedCategory;

  selectedColor = signal<string | null>(null);
  selectedSize = signal<string | null>(null);
  searchTerm = signal('');

  categories = this.categoriesService.categories;

  // ==========================================
  // DATOS DESDE SUPABASE
  // ==========================================

  loading = this.productsService.loading;
  error = this.productsService.error;

  products = this.productsService.products;

  // ==========================================
  // COLORES
  // Incluye variantes disponibles y agotadas
  // ==========================================

  colors = computed(() => {
    const values = this.products()
      .filter(product => product.active)
      .flatMap(product => product.variants)
      .map(variant => variant.color)
      .filter(color => color.trim().length > 0);

    return [...new Set(values)];
  });

  // ==========================================
  // TALLAS
  // Incluye variantes disponibles y agotadas
  // ==========================================

  sizes = computed(() => {
    const values = this.products()
      .filter(product => product.active)
      .flatMap(product => product.variants)
      .map(variant => variant.size)
      .filter((size): size is string =>
        typeof size === 'string' &&
        size.trim().length > 0
      );

    return [...new Set(values)];
  });

  // ==========================================
  // FILTRAR PRODUCTOS
  // No oculta productos por stock en cero
  // ==========================================

  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const color = this.selectedColor();
    const size = this.selectedSize();
    const search = this.searchTerm().trim().toLowerCase();

    return this.products().filter(product => {

      // Mostrar solo productos activos
      if (!product.active) {
        return false;
      }

      // Filtrar por categoría
      if (
        category &&
        product.categorySlug !== category
      ) {
        return false;
      }

      // Buscar por nombre
      if (
        search &&
        !product.name.toLowerCase().includes(search)
      ) {
        return false;
      }

      // Si no hay filtros de color ni talla,
      // mostrar el producto aunque esté agotado.
      if (!color && !size) {
        return true;
      }

      // Buscar coincidencias entre TODAS
      // las variantes, incluso sin stock.
      return product.variants.some(variant =>
        (!color || variant.color === color) &&
        (!size || variant.size === size)
      );
    });
  });

  // ==========================================
  // VARIANTE QUE MOSTRARÁ LA TARJETA
  // ==========================================

  getDisplayVariant(
    product: Product
  ): ProductVariant | undefined {

    const color = this.selectedColor();
    const size = this.selectedSize();

    // Priorizar la variante que coincide
    // con los filtros, aunque esté agotada.
    const matchingVariant = product.variants.find(
      variant =>
        (!color || variant.color === color) &&
        (!size || variant.size === size)
    );

    if (matchingVariant) {
      return matchingVariant;
    }

    // Si no hay filtros, mostrar primero
    // una variante que tenga inventario.
    const availableVariant = product.variants.find(
      variant => variant.available
    );

    return availableVariant ?? product.variants[0];
  }

  // ==========================================
  // SELECCIONAR CATEGORÍA
  // ==========================================

  selectCategory(slug: string | null): void {
    this.categoriesService.selectCategory(slug);
  }

  // ==========================================
  // SELECCIONAR COLOR
  // ==========================================

  selectColor(color: string | null): void {
    this.selectedColor.set(color);
  }

  // ==========================================
  // SELECCIONAR TALLA
  // ==========================================

  selectSize(size: string | null): void {
    this.selectedSize.set(size);
  }

  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================

  clearFilters(): void {
    this.categoriesService.selectCategory(null);
    this.selectedColor.set(null);
    this.selectedSize.set(null);
    this.searchTerm.set('');
  }

  // ==========================================
  // ACTUALIZAR CATÁLOGO
  // ==========================================

  async refreshProducts(): Promise<void> {
    await this.productsService.loadProducts();
  }
}
