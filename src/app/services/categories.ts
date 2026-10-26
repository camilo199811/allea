
import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import { Category } from '../models/category.model';
import { SupabaseService } from './supabase';

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Categories {

  private readonly supabase = inject(SupabaseService);

  private readonly categoriesState = signal<Category[]>([]);

  loading = signal(false);
  error = signal('');

  // Todas las categorías, incluidas las inactivas.
  // Útil para el panel administrador.
  allCategories = computed(() =>
    [...this.categoriesState()].sort(
      (a, b) => a.position - b.position
    )
  );

  // Solo categorías activas para la tienda.
  categories = computed(() =>
    this.allCategories().filter(
      category => category.active
    )
  );

  selectedCategory = signal<string | null>(null);

  constructor() {
    void this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .select(
          'id, name, slug, image_url, sort_order, is_active'
        )
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      const categories: Category[] = (
        (data ?? []) as DbCategory[]
      ).map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.image_url ?? '',
        active: category.is_active,
        position: category.sort_order ?? 0
      }));

      this.categoriesState.set(categories);

      // Si la categoría seleccionada deja de estar
      // activa, regresamos a todos los productos.
      const selected = this.selectedCategory();

      if (
        selected &&
        !categories.some(
          category =>
            category.slug === selected &&
            category.active
        )
      ) {
        this.selectedCategory.set(null);
      }

    } catch (error) {
      console.error(
        'Error cargando categorías:',
        error
      );

      this.error.set(
        'No fue posible cargar las categorías.'
      );

    } finally {
      this.loading.set(false);
    }
  }

  selectCategory(slug: string | null): void {
    this.selectedCategory.set(slug);
  }
}
