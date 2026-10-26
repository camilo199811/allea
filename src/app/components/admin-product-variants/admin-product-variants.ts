
import {
  Component,
  inject,
  input,
  output,
  signal,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { AdminProductImages } from '../admin-product-images/admin-product-images';

import {
  ProductVariantsAdminService,
  ProductVariant,
  CreateVariant
} from '../../services/product-variants-admin';

@Component({
  selector: 'app-admin-product-variants',
  standalone: true,
  imports: [
    FormsModule,
    AdminProductImages
  ],
  templateUrl: './admin-product-variants.html',
  styleUrl: './admin-product-variants.scss'
})
export class AdminProductVariants implements OnInit {

  private readonly variantsService =
    inject(ProductVariantsAdminService);

  // Datos recibidos desde el administrador
  productId = input.required<string>();
  productName = input.required<string>();
  isSupplement = input(false);

  // Evento para regresar al inventario
  closed = output<void>();

  // Variante seleccionada para gestionar fotografías
  selectedImageVariant = signal<ProductVariant | null>(null);

  // Estado del listado
  variants = signal<ProductVariant[]>([]);
  loading = signal(false);
  saving = signal(false);
  deletingId = signal<string | null>(null);
  editingId = signal<string | null>(null);

  errorMessage = signal('');
  successMessage = signal('');

  // Formulario
  form: CreateVariant = {
    product_id: '',
    color_name: null,
    color_hex: null,
    size: 'Única',
    flavor: null,
    presentation: null,
    sku: null,
    stock: 0,
    is_active: true,
    sort_order: 0
  };

  ngOnInit(): void {
    this.resetForm();
    void this.loadVariants();
  }

  // =====================================
  // FOTOGRAFÍAS
  // =====================================

  openImages(variant: ProductVariant): void {
    this.selectedImageVariant.set(variant);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeImages(): void {
    this.selectedImageVariant.set(null);
  }

  // =====================================
  // CARGAR VARIANTES
  // =====================================

  async loadVariants(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const data = await this.variantsService.getVariants(
        this.productId()
      );

      this.variants.set(data);

    } catch (error) {
      console.error('Error cargando variantes:', error);

      this.errorMessage.set(
        'No fue posible cargar las variantes.'
      );

    } finally {
      this.loading.set(false);
    }
  }

  // =====================================
  // EDITAR VARIANTE
  // =====================================

  startEdit(variant: ProductVariant): void {
    this.editingId.set(variant.id);

    this.form = {
      product_id: variant.product_id,
      color_name: variant.color_name,
      color_hex: variant.color_hex,
      size: variant.size,
      flavor: variant.flavor,
      presentation: variant.presentation,
      sku: variant.sku,
      stock: variant.stock,
      is_active: variant.is_active,
      sort_order: variant.sort_order
    };

    this.errorMessage.set('');
    this.successMessage.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
    this.errorMessage.set('');
  }

  // =====================================
  // REINICIAR FORMULARIO
  // =====================================

  private resetForm(): void {
    this.form = {
      product_id: this.productId(),
      color_name: null,
      color_hex: '#000000',
      size: this.isSupplement() ? null : 'Única',
      flavor: null,
      presentation: null,
      sku: null,
      stock: 0,
      is_active: true,
      sort_order: 0
    };
  }

  // =====================================
  // GUARDAR VARIANTE
  // =====================================

  async saveVariant(): Promise<void> {
    if (this.saving()) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    // Validación de ropa deportiva
    if (
      !this.isSupplement() &&
      !this.form.color_name?.trim()
    ) {
      this.errorMessage.set(
        'Debes escribir el color de la prenda.'
      );
      return;
    }

    if (
      !this.isSupplement() &&
      !this.form.size?.trim()
    ) {
      this.errorMessage.set(
        'Debes seleccionar una talla.'
      );
      return;
    }

    // Validación de suplementos
    if (
      this.isSupplement() &&
      !this.form.flavor?.trim()
    ) {
      this.errorMessage.set(
        'Debes escribir el sabor del suplemento.'
      );
      return;
    }

    const stock = Number(this.form.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      this.errorMessage.set(
        'El inventario debe ser un número entero mayor o igual a cero.'
      );
      return;
    }

    this.saving.set(true);

    try {
      const payload: CreateVariant = {
        ...this.form,
        product_id: this.productId(),
        stock,

        color_name: this.isSupplement()
          ? null
          : this.form.color_name?.trim() || null,

        color_hex: this.isSupplement()
          ? null
          : this.form.color_hex || null,

        size: this.isSupplement()
          ? null
          : this.form.size?.trim() || null,

        flavor: this.isSupplement()
          ? this.form.flavor?.trim() || null
          : null,

        presentation: this.isSupplement()
          ? this.form.presentation?.trim() || null
          : null,

        sku: this.form.sku?.trim() || null
      };

      const currentEditingId = this.editingId();

      if (currentEditingId) {
        await this.variantsService.updateVariant(
          currentEditingId,
          payload
        );
      } else {
        await this.variantsService.createVariant(payload);
      }

      await this.loadVariants();

      this.editingId.set(null);
      this.resetForm();

      this.successMessage.set(
        currentEditingId
          ? 'Variante actualizada correctamente.'
          : 'Variante agregada correctamente.'
      );

    } catch (error: any) {
      console.error('Error guardando variante:', error);

      this.errorMessage.set(
        error?.code === '23505'
          ? 'Ya existe una variante con esa referencia SKU.'
          : 'No fue posible guardar la variante.'
      );

    } finally {
      this.saving.set(false);
    }
  }

  // =====================================
  // ELIMINAR VARIANTE
  // =====================================

  async deleteVariant(
    variant: ProductVariant
  ): Promise<void> {

    if (this.deletingId()) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la variante ` +
      `"${this.variantLabel(variant)}"?\n\n` +
      'Esta acción puede eliminar sus registros ' +
      'de fotografías asociados.'
    );

    if (!confirmed) return;

    this.deletingId.set(variant.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.variantsService.deleteVariant(
        variant.id
      );

      await this.loadVariants();

      if (this.editingId() === variant.id) {
        this.cancelEdit();
      }

      this.successMessage.set(
        'Variante eliminada correctamente.'
      );

    } catch (error) {
      console.error('Error eliminando variante:', error);

      this.errorMessage.set(
        'No fue posible eliminar la variante.'
      );

    } finally {
      this.deletingId.set(null);
    }
  }

  // =====================================
  // NOMBRE VISIBLE DE LA VARIANTE
  // =====================================

  variantLabel(variant: ProductVariant): string {

    if (this.isSupplement()) {
      return [
        variant.flavor,
        variant.presentation
      ]
        .filter(Boolean)
        .join(' · ');
    }

    return [
      variant.color_name,
      variant.size
    ]
      .filter(Boolean)
      .join(' · ');
  }
}
