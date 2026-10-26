
import {
  Component,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Category } from '../../models/category.model';
import {
  CategoriesAdminService
} from '../../services/categories-admin';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-category-form.html',
  styleUrl: './admin-category-form.scss'
})
export class AdminCategoryForm {

  private readonly adminService =
    inject(CategoriesAdminService);

  category = input<Category | null>(null);

  saved = output<void>();
  cancelled = output<void>();

  name = signal('');
  slug = signal('');
  imageUrl = signal('');
  active = signal(true);
  position = signal(1);

  selectedFile = signal<File | null>(null);

  saving = signal(false);
  error = signal('');

  constructor() {
    effect(() => {
      const category = this.category();

      this.name.set(category?.name ?? '');
      this.slug.set(category?.slug ?? '');
      this.imageUrl.set(category?.imageUrl ?? '');
      this.active.set(category?.active ?? true);
      this.position.set(category?.position ?? 1);
      this.selectedFile.set(null);
      this.error.set('');
    });
  }

  generateSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onNameChange(value: string): void {
    const previousAutoSlug =
      this.generateSlug(this.name());

    this.name.set(value);

    if (
      !this.slug() ||
      this.slug() === previousAutoSlug
    ) {
      this.slug.set(this.generateSlug(value));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);
  }

  async save(): Promise<void> {

    if (this.saving()) return;

    if (!this.name().trim()) {
      this.error.set('Ingresa el nombre de la categoría.');
      return;
    }

    if (!this.slug().trim()) {
      this.error.set('Ingresa el slug de la categoría.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      let imageUrl = this.imageUrl();

      if (this.selectedFile()) {
        imageUrl = await this.adminService.uploadImage(
          this.selectedFile()!
        );
      }

      await this.adminService.saveCategory(
        {
          name: this.name(),
          slug: this.generateSlug(this.slug()),
          imageUrl,
          active: this.active(),
          position: Number(this.position())
        },
        this.category()?.id
      );

      this.saved.emit();

    } catch (error) {
      console.error(error);

      this.error.set(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la categoría.'
      );

    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
