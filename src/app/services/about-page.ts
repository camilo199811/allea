
import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import { SupabaseService } from './supabase';

export interface AboutPageContent {
  id: number;

  hero_title: string;
  hero_highlight: string;
  hero_description: string;
  hero_image: string | null;

  story_title: string;
  story_highlight: string;
  story_paragraph_one: string;
  story_paragraph_two: string;
  story_image: string | null;

  products_title: string;
  products_highlight: string;
  products_description: string;
  products_image: string | null;

  detail_one_title: string;
  detail_one_description: string;
  detail_one_image: string | null;

  detail_two_title: string;
  detail_two_description: string;
  detail_two_image: string | null;

  confidence_title: string;
  confidence_highlight: string;
  confidence_description: string;
  confidence_image: string | null;

  benefit_one: string;
  benefit_two: string;
  benefit_three: string;
  benefit_four: string;

  mission: string;
  vision: string;
  brand_phrase: string;
  purpose_image: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AboutPageService {

  private readonly supabase = inject(SupabaseService);

  content = signal<AboutPageContent | null>(null);
  loading = signal(false);
  error = signal('');

  async loadContent(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('about_page')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;

      this.content.set(data as AboutPageContent);

    } catch (error) {
      console.error('Error cargando Nosotras:', error);

      this.error.set(
        'No fue posible cargar la información de Nosotras.'
      );

    } finally {
      this.loading.set(false);
    }
  }

  async saveContent(
    content: AboutPageContent
  ): Promise<void> {

    const { id, ...fields } = content;

    const { data, error } = await this.supabase.client
      .from('about_page')
      .update({
        ...fields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    this.content.set(data as AboutPageContent);
  }

  async uploadImage(
    file: File,
    field: string
  ): Promise<string> {

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        'Solo se permiten imágenes JPG, PNG o WebP.'
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        'La imagen no puede superar los 5 MB.'
      );
    }

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase() || 'jpg';

    const fileName =
      `nosotras/${field}-${crypto.randomUUID()}.${extension}`;

    const { error } = await this.supabase.client.storage
      .from('allea-images')
      .upload(fileName, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = this.supabase.client.storage
      .from('allea-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}
