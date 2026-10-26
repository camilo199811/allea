
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { HeroSlide } from '../models/hero-slide.model';

export type HeroSlideInput = Omit<HeroSlide, 'id'>;

@Injectable({ providedIn: 'root' })
export class HeroSlidesAdminService {
  private readonly supabase = inject(SupabaseService);

  async getSlides(): Promise<HeroSlide[]> {
    const { data, error } = await this.supabase.client
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(row => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? '',
      imageDesktop: row.image_desktop,
      imageMobile: row.image_mobile || row.image_desktop,
      buttonText: row.button_text ?? '',
      buttonLink: row.button_link ?? '',
      active: row.is_active,
      position: row.sort_order
    }));
  }

  async saveSlide(
    input: HeroSlideInput,
    id?: string
  ): Promise<void> {
    const slides = await this.getSlides();

    const otherActive = slides.filter(
      slide => slide.active && slide.id !== id
    ).length;

    if (input.active && otherActive >= 5) {
      throw new Error(
        'ALLÉA permite máximo 5 banners activos. ' +
        'Desactiva uno antes de continuar.'
      );
    }

    const payload = {
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      image_desktop: input.imageDesktop,
      image_mobile: input.imageMobile || null,
      button_text: input.buttonText.trim() || null,
      button_link: input.buttonLink.trim() || null,
      is_active: input.active,
      sort_order: input.position
    };

    if (id) {
      const { data, error } = await this.supabase.client
        .from('hero_slides')
        .update(payload)
        .eq('id', id)
        .select('id');

      if (error) throw error;
      if (!data?.length) {
        throw new Error('No se pudo actualizar el banner.');
      }
    } else {
      const { error } = await this.supabase.client
        .from('hero_slides')
        .insert(payload);

      if (error) throw error;
    }
  }

  async deleteSlide(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('hero_slides')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data?.length) {
      throw new Error('No se pudo eliminar el banner.');
    }
  }

  async uploadImage(file: File): Promise<string> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Usa una imagen JPG, PNG o WebP.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no puede superar 5 MB.');
    }

    const extension =
      file.type === 'image/png' ? 'png' :
      file.type === 'image/webp' ? 'webp' : 'jpg';

    const path =
      `slider/${crypto.randomUUID()}.${extension}`;

    const { error } = await this.supabase.client.storage
      .from('allea-images')
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = this.supabase.client.storage
      .from('allea-images')
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
