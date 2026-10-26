
import {
  Component,
  inject,
  input,
  output,
  signal,
  OnInit
} from '@angular/core';

import {
  ProductImagesAdminService,
  ProductImage
} from '../../services/product-images-admin';

@Component({
  selector: 'app-admin-product-images',
  standalone: true,
  templateUrl: './admin-product-images.html',
  styleUrl: './admin-product-images.scss'
})
export class AdminProductImages implements OnInit {

  private readonly imageService =
    inject(ProductImagesAdminService);

  productId = input.required<string>();
  variantId = input.required<string>();
  productName = input.required<string>();
  variantName = input.required<string>();

  closed = output<void>();

  images = signal<ProductImage[]>([]);
  loading = signal(false);
  uploading = signal(false);
  busyId = signal<string | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  selectedFiles: File[] = [];

  ngOnInit(): void {
    void this.loadImages();
  }

  async loadImages(): Promise<void> {
    this.loading.set(true);

    try {
      const images = await this.imageService.getImages(
        this.productId(),
        this.variantId()
      );

      this.images.set(images);
    } catch (error) {
      console.error(error);
      this.errorMessage.set(
        'No se pudieron cargar las fotografías.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  


onFilesSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const newFiles = Array.from(input.files ?? []);

  for (const file of newFiles) {
    const alreadyExists = this.selectedFiles.some(
      (existing: File) =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      this.selectedFiles.push(file);
    }
  }

  this.errorMessage.set('');
  input.value = '';
}

removeSelectedFile(index: number): void {
  this.selectedFiles.splice(index, 1);
}


  async uploadImages(): Promise<void> {
    if (this.uploading() || !this.selectedFiles.length) {
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    let uploadedCount = 0;

    try {
      for (const file of this.selectedFiles) {
        await this.imageService.uploadImage(
          this.productId(),
          this.variantId(),
          file,
          this.images().length === 0 && uploadedCount === 0
        );

        uploadedCount++;
      }

      this.selectedFiles = [];
      this.successMessage.set(
        `${uploadedCount} fotografía(s) subida(s) correctamente.`
      );
    } catch (error) {
      console.error(error);
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No fue posible subir todas las fotografías.'
      );
    } finally {
      await this.loadImages();
      this.uploading.set(false);
    }
  }

  async makePrimary(image: ProductImage): Promise<void> {
    if (this.busyId()) return;

    this.busyId.set(image.id);
    this.errorMessage.set('');

    try {
      await this.imageService.setPrimaryImage(
        this.productId(),
        this.variantId(),
        image.id
      );

      await this.loadImages();
    } catch (error) {
      console.error(error);
      this.errorMessage.set(
        'No se pudo cambiar la fotografía principal.'
      );
    } finally {
      this.busyId.set(null);
    }
  }

  async moveImage(
    image: ProductImage,
    direction: -1 | 1
  ): Promise<void> {
    if (this.busyId()) return;

    const list = this.images();
    const index = list.findIndex(item => item.id === image.id);
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= list.length) return;

    this.busyId.set(image.id);
    this.errorMessage.set('');

    try {
      const other = list[nextIndex];

      // Asignamos posiciones nuevas para evitar empates.
      const reordered = [...list];
      [reordered[index], reordered[nextIndex]] =
        [reordered[nextIndex], reordered[index]];

      for (let i = 0; i < reordered.length; i++) {
        await this.imageService.updateOrder(
          reordered[i].id,
          i
        );
      }

      await this.loadImages();
    } catch (error) {
      console.error(error);
      this.errorMessage.set(
        'No fue posible cambiar el orden.'
      );
      await this.loadImages();
    } finally {
      this.busyId.set(null);
    }
  }

  async deleteImage(image: ProductImage): Promise<void> {
    if (this.busyId()) return;

    const confirmed = window.confirm(
      '¿Eliminar esta fotografía de ALLÉA?'
    );

    if (!confirmed) return;

    this.busyId.set(image.id);
    this.errorMessage.set('');

    try {
      await this.imageService.deleteImage(image);
      await this.loadImages();

      // Si se eliminó la principal, asignamos otra.
      if (image.is_primary && this.images().length) {
        await this.imageService.setPrimaryImage(
          this.productId(),
          this.variantId(),
          this.images()[0].id
        );
        await this.loadImages();
      }

      this.successMessage.set('Fotografía eliminada.');
    } catch (error) {
      console.error(error);
      this.errorMessage.set(
        'No se pudo completar la eliminación.'
      );
      await this.loadImages();
    } finally {
      this.busyId.set(null);
    }
  }
}
