
import {
  Component,
  inject,
  signal,
  output,
  input,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ProductsAdminService,
  AdminProduct,
  CreateProduct
} from '../../services/products-admin';

import { SupabaseService } from '../../services/supabase';

interface CategoryOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.scss'
})
export class AdminProductForm implements OnInit {

  private readonly productsAdmin =
    inject(ProductsAdminService);

  private readonly supabase =
    inject(SupabaseService);

  product = input<AdminProduct | null>(null);

  saved = output<void>();
  cancelled = output<void>();

  categories = signal<CategoryOption[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  form: CreateProduct = {
    name: '',
    slug: '',
    category_id: '',
    description: '',
    price: 0,
    is_active: true,
    is_featured: false
  };

  async ngOnInit(): Promise<void> {
    await this.loadCategories();

    const current = this.product();

    if (current) {
      this.form = {
        name: current.name,
        slug: current.slug,
        category_id: current.category_id,
        description: current.description,
        price: current.price,
        is_active: current.is_active,
        is_featured: current.is_featured
      };
    }
  }

  async loadCategories(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('id, name')
      .order('sort_order');

    if (error) {
      this.errorMessage.set(
        'No se pudieron cargar las categorías.'
      );
      return;
    }

    this.categories.set(data ?? []);
  }

  generateSlug(): void {
    // Al editar, conservamos el slug existente
    // para evitar cambiar enlaces públicos.
    if (this.product()) return;

    this.form.slug = this.form.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async saveProduct(): Promise<void> {
    if (this.loading()) return;

    this.errorMessage.set('');

    const price = Number(this.form.price);

    if (
      !this.form.name.trim() ||
      !this.form.category_id ||
      !this.form.slug.trim() ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      this.errorMessage.set(
        'Completa correctamente los campos obligatorios.'
      );
      return;
    }

    this.loading.set(true);

    try {
      const payload: CreateProduct = {
        ...this.form,
        name: this.form.name.trim(),
        slug: this.form.slug.trim(),
        description: this.form.description.trim(),
        price
      };

      const current = this.product();

      if (current) {
        await this.productsAdmin.updateProduct(
          current.id,
          payload
        );
      } else {
        await this.productsAdmin.createProduct(
          payload
        );
      }

      this.saved.emit();

    } catch (error: any) {
      console.error(error);

      this.errorMessage.set(
        error?.code === '23505'
          ? 'Ya existe un producto con ese identificador.'
          : 'No fue posible guardar los cambios.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}
