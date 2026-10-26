
import { Injectable, inject, signal } from '@angular/core';

import { Product } from '../models/product.model';
import { SupabaseService } from './supabase';

interface DbCategory {
  slug: string;
}

interface DbImage {
  id: string;
  variant_id: string | null;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

interface DbVariant {
  id: string;
  color_name: string | null;
  color_hex: string | null;
  size: string | null;
  flavor: string | null;
  presentation: string | null;
  stock: number;
  is_active: boolean;
  sort_order: number;
  product_images: DbImage[] | null;
}

interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  categories: DbCategory | null;
  product_variants: DbVariant[] | null;
  product_images: DbImage[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class Products {

  private readonly supabase = inject(SupabaseService);

  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal('');

  constructor() {
    void this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          is_active,
          sort_order,
          categories (
            slug
          ),
          product_variants (
            id,
            color_name,
            color_hex,
            size,
            flavor,
            presentation,
            stock,
            is_active,
            sort_order,
            product_images (
              id,
              image_url,
              alt_text,
              is_primary,
              sort_order,
              variant_id
            )
          ),
          product_images (
            id,
            image_url,
            alt_text,
            is_primary,
            variant_id,
            sort_order
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const dbProducts = (data ?? []) as unknown as DbProduct[];

      const mappedProducts: Product[] = dbProducts.map(
        product => {

          const variants = (product.product_variants ?? [])
            .filter(variant => variant.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(variant => {

              // Imágenes propias de la variante.
              const variantImages = variant.product_images ?? [];

              // Imágenes generales del producto,
              // sin una variante específica.
              const generalImages = (
  product.product_images ?? []
).filter(image => image.variant_id === null);

              const images = (
                variantImages.length
                  ? variantImages
                  : generalImages
              )
                .sort((a, b) =>
                  Number(b.is_primary) - Number(a.is_primary) ||
                  a.sort_order - b.sort_order
                )
                .map(image => ({
                  id: image.id,
                  url: image.image_url,
                  alt: image.alt_text || product.name,
                  position: image.sort_order + 1
                }));

              
return {
  id: variant.id,
  color: variant.color_name || '',
  colorHex: variant.color_hex || '',
  size: variant.size,
  flavor: variant.flavor || undefined,
  presentation: variant.presentation || undefined,
  available: variant.stock > 0,
  stock: Number(variant.stock),
  images
};

            });

          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            price: Number(product.price),
            categorySlug: product.categories?.slug || '',
            active: product.is_active,
            variants
          };
        }
      );

      this.products.set(mappedProducts);

    } catch (error) {
      console.error(
        'Error cargando catálogo ALLÉA:',
        error
      );

      this.error.set(
        'No fue posible cargar el catálogo. Intenta nuevamente.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}
