
import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { AdminAboutPage } from '../../components/admin-about-page/admin-about-page';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../services/supabase';
import { Products } from '../../services/products';
import { Categories } from '../../services/categories';
import { AuthService } from '../../services/auth';

import { Category } from '../../models/category.model';

import {
  CategoriesAdminService
} from '../../services/categories-admin';

import {
  AdminCategoryForm
} from '../../components/admin-category-form/admin-category-form';

import {
  ProductsAdminService,
  AdminProduct
} from '../../services/products-admin';

import {
  AdminProductForm
} from '../../components/admin-product-form/admin-product-form';

import {
  AdminProductVariants
} from '../../components/admin-product-variants/admin-product-variants';

import {
  AdminHeroSlides
} from '../../components/admin-hero-slides/admin-hero-slides';

import {
  AdminStoreSettings
} from '../../components/admin-store-settings/admin-store-settings';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'slider'
  | 'settings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    RouterLink,
    AdminProductForm,
    AdminProductVariants,
    AdminCategoryForm,
    AdminHeroSlides,
    AdminStoreSettings,
  AdminAboutPage
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {

  private readonly supabaseService =
    inject(SupabaseService);

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly productsService =
    inject(Products);

  private readonly categoriesService =
    inject(Categories);

  private readonly productsAdminService =
    inject(ProductsAdminService);

  private readonly categoriesAdminService =
    inject(CategoriesAdminService);

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  section = signal<AdminSection>('dashboard');

  // ==========================================
  // PRODUCTOS
  // ==========================================

  showProductForm = signal(false);

  editingProduct = signal<AdminProduct | null>(null);

  deletingProductId = signal<string | null>(null);

  deleteError = signal('');

  variantsProduct = signal<AdminProduct | null>(null);

  adminProducts = signal<AdminProduct[]>([]);

  loadingProducts = signal(false);

  productsError = signal('');

  products = this.productsService.products;

  // ==========================================
  // CATEGORÍAS
  // ==========================================

  showCategoryForm = signal(false);

  editingCategory = signal<Category | null>(null);

  deletingCategoryId = signal<string | null>(null);

  categoryError = signal('');

  categories = this.categoriesService.allCategories;

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  totalProducts = computed(() =>
    this.adminProducts().length
  );

  activeProducts = computed(() =>
    this.adminProducts().filter(
      product => product.is_active
    ).length
  );

  totalCategories = computed(() =>
    this.categories().length
  );

  totalVariants = signal(0);

  constructor() {
    void this.loadAdminProducts();
    void this.categoriesService.loadCategories();
  }

  // ==========================================
  // ADMINISTRAR CATEGORÍAS
  // ==========================================

  openCategoryForm(): void {
    this.editingCategory.set(null);
    this.showCategoryForm.set(true);
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.showCategoryForm.set(true);
  }

  closeCategoryForm(): void {
    this.showCategoryForm.set(false);
    this.editingCategory.set(null);
  }

  async onCategorySaved(): Promise<void> {
    await this.categoriesService.loadCategories();
    this.closeCategoryForm();
  }

  async deleteCategory(category: Category): Promise<void> {

    if (this.deletingCategoryId()) return;

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) return;

    this.categoryError.set('');
    this.deletingCategoryId.set(category.id);

    try {
      await this.categoriesAdminService.deleteCategory(
        category
      );

      await this.categoriesService.loadCategories();

    } catch (error) {
      this.categoryError.set(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la categoría.'
      );

    } finally {
      this.deletingCategoryId.set(null);
    }
  }

  // ==========================================
  // ADMINISTRAR VARIANTES
  // ==========================================

  openProductVariants(product: AdminProduct): void {
    this.closeProductForm();
    this.variantsProduct.set(product);
  }

  closeProductVariants(): void {
    this.variantsProduct.set(null);
  }

  isSupplementProduct(product: AdminProduct): boolean {
    const category = this.categories().find(
      item => item.id === product.category_id
    );

    return category?.slug === 'suplementos';
  }

  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  async loadAdminProducts(): Promise<void> {
    this.loadingProducts.set(true);
    this.productsError.set('');

    try {
      const data =
        await this.productsAdminService.getProducts();

      this.adminProducts.set(data);

    } catch (error) {
      console.error(
        'Error cargando productos:',
        error
      );

      this.productsError.set(
        'No fue posible cargar los productos.'
      );

    } finally {
      this.loadingProducts.set(false);
    }
  }

  // ==========================================
  // CREAR Y EDITAR PRODUCTOS
  // ==========================================

  openProductForm(): void {
    this.editingProduct.set(null);
    this.showProductForm.set(true);
    this.closeProductVariants();
  }

  editProduct(product: AdminProduct): void {
    this.editingProduct.set(product);
    this.showProductForm.set(true);
    this.closeProductVariants();
  }

  closeProductForm(): void {
    this.showProductForm.set(false);
    this.editingProduct.set(null);
  }

  async onProductSaved(): Promise<void> {
    await this.loadAdminProducts();
    this.closeProductForm();
  }

  // ==========================================
  // ELIMINAR PRODUCTOS
  // ==========================================

  async deleteProduct(product: AdminProduct): Promise<void> {

    if (this.deletingProductId()) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${product.name}"?\n\n` +
      'Esta acción eliminará el producto y sus ' +
      'variantes y registros de fotografías asociados.'
    );

    if (!confirmed) return;

    this.deleteError.set('');
    this.deletingProductId.set(product.id);

    try {
      await this.productsAdminService.deleteProduct(
        product.id
      );

      await this.loadAdminProducts();

    } catch (error) {
      console.error(
        'Error eliminando producto:',
        error
      );

      this.deleteError.set(
        'No fue posible eliminar el producto. ' +
        'Intenta nuevamente.'
      );

    } finally {
      this.deletingProductId.set(null);
    }
  }

  // ==========================================
  // CAMBIAR SECCIÓN
  // ==========================================

  changeSection(section: AdminSection): void {
    this.section.set(section);

    this.closeProductForm();
    this.closeCategoryForm();
    this.closeProductVariants();

    if (
      section === 'products' ||
      section === 'dashboard'
    ) {
      void this.loadAdminProducts();
    }

    if (section === 'categories') {
      void this.categoriesService.loadCategories();
    }
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  async cerrarSesion(): Promise<void> {
    const { error } =
      await this.authService.logout();

    if (error) {
      console.error(
        'Error al cerrar sesión:',
        error.message
      );
      return;
    }

    await this.router.navigateByUrl('/admin/login');
  }

  // ==========================================
  // TÍTULOS DEL ADMINISTRADOR
  // ==========================================

  getSectionTitle(): string {
    switch (this.section()) {

      case 'products':
        return 'Productos';

      case 'categories':
        return 'Categorías';

      case 'slider':
        return 'Slider principal';

      case 'settings':
        return 'Configuración';

      default:
        return 'Panel de control';
    }
  }
}
