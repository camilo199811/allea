
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductImagesAdminService {

  private readonly supabase = inject(SupabaseService);
  private readonly bucket = 'allea-images';

  async getImages(
    productId: string,
    variantId: string
  ): Promise<ProductImage[]> {
    const { data, error } = await this.supabase.client
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data ?? []) as ProductImage[];
  }

  async uploadImage(
    productId: string,
    variantId: string,
    file: File,
    isPrimary: boolean
  ): Promise<void> {

    if (!['image/jpeg', 'image/png', 'image/webp']
      .includes(file.type)) {
      throw new Error(
        'Solo se permiten imágenes JPG, PNG o WEBP.'
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        'La imagen no puede superar los 5 MB.'
      );
    }

    const extension = file.type === 'image/jpeg'
      ? 'jpg'
      : file.type === 'image/png'
        ? 'png'
        : 'webp';

    const path =
      `products/${productId}/${variantId}/` +
      `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await this.supabase.client.storage
        .from(this.bucket)
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

    if (uploadError) throw uploadError;

    const { data: urlData } =
      this.supabase.client.storage
        .from(this.bucket)
        .getPublicUrl(path);

    const { data: existingImages, error: listError } =
      await this.supabase.client
        .from('product_images')
        .select('id, sort_order')
        .eq('product_id', productId)
        .eq('variant_id', variantId)
        .order('sort_order', { ascending: false })
        .limit(1);

    if (listError) {
      await this.removeStorageFile(path);
      throw listError;
    }

    const nextOrder = existingImages?.length
      ? existingImages[0].sort_order + 1
      : 0;

    const { error: insertError } =
      await this.supabase.client
        .from('product_images')
        .insert({
          product_id: productId,
          variant_id: variantId,
          image_url: urlData.publicUrl,
          alt_text: file.name,
          is_primary: false,
          sort_order: nextOrder
        });

    if (insertError) {
      await this.removeStorageFile(path);
      throw insertError;
    }

    if (isPrimary) {
      const images = await this.getImages(
        productId,
        variantId
      );

      const uploaded = images.find(
        image => image.image_url === urlData.publicUrl
      );

      if (uploaded) {
        await this.setPrimaryImage(
          productId,
          variantId,
          uploaded.id
        );
      }
    }
  }

  async setPrimaryImage(
    productId: string,
    variantId: string,
    imageId: string
  ): Promise<void> {

    const { error: resetError } =
      await this.supabase.client
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
        .eq('variant_id', variantId);

    if (resetError) throw resetError;

    const { data, error } =
      await this.supabase.client
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('product_id', productId)
        .eq('variant_id', variantId)
        .select('id')
        .single();

    if (error) throw error;
    if (!data) throw new Error('Imagen no encontrada.');
  }

  async updateOrder(
    imageId: string,
    sortOrder: number
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('product_images')
      .update({ sort_order: sortOrder })
      .eq('id', imageId);

    if (error) throw error;
  }

  async deleteImage(image: ProductImage): Promise<void> {
    const path = this.getStoragePath(image.image_url);

    if (!path) {
      throw new Error('La URL no pertenece al bucket.');
    }

    // Primero quitamos el archivo físico.
    await this.removeStorageFile(path);

    const { error } = await this.supabase.client
      .from('product_images')
      .delete()
      .eq('id', image.id);

    if (error) throw error;
  }

  private async removeStorageFile(
    path: string
  ): Promise<void> {
    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) throw error;
  }

  private getStoragePath(url: string): string | null {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const position = url.indexOf(marker);

    if (position === -1) return null;

    return decodeURIComponent(
      url.substring(position + marker.length)
    );
  }
}
