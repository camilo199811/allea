
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { Category } from '../models/category.model';

export interface CategoryInput {
  name: string;
  slug: string;
  imageUrl: string;
  active: boolean;
  position: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesAdminService {

  private readonly supabase = inject(SupabaseService);

  private get client() {
    return this.supabase.client;
  }

  async saveCategory(
    input: CategoryInput,
    categoryId?: string
  ): Promise<void> {

    const payload = {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      image_url: input.imageUrl.trim() || null,
      is_active: input.active,
      sort_order: input.position
    };

    if (categoryId) {
      const { error } = await this.client
        .from('categories')
        .update(payload)
        .eq('id', categoryId);

      if (error) throw error;

      return;
    }

    const { error } = await this.client
      .from('categories')
      .insert(payload);

    if (error) throw error;
  }

  async deleteCategory(category: Category): Promise<void> {

    // Comprobar productos asociados.
    const { count, error: countError } = await this.client
      .from('products')
      .select('id', {
        count: 'exact',
        head: true
      })
      .eq('category_id', category.id);

    if (countError) throw countError;

    if ((count ?? 0) > 0) {
      throw new Error(
        'Esta categoría tiene productos asociados. ' +
        'Debes moverlos a otra categoría antes de eliminarla.'
      );
    }

    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) throw error;
  }

  async uploadImage(file: File): Promise<string> {

    if (!file.type.startsWith('image/')) {
      throw new Error('Selecciona una imagen válida.');
    }

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase() || 'jpg';

    const filePath =
      `categories/${crypto.randomUUID()}.${extension}`;

    const { error } = await this.client.storage
      .from('allea-images')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = this.client.storage
      .from('allea-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}
