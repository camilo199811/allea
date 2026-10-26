
import {
  Injectable,
  inject,
  signal,
  computed
} from '@angular/core';

import { SupabaseService } from './supabase';
import { HeroSlide } from '../models/hero-slide.model';

@Injectable({
  providedIn: 'root'
})
export class HeroSlidesService {

  private readonly supabase = inject(SupabaseService);

  private readonly slidesState = signal<HeroSlide[]>([]);

  loading = signal(false);
  error = signal('');

  slides = computed(() =>
    this.slidesState()
      .filter(slide => slide.active)
      .sort((a, b) => a.position - b.position)
      .slice(0, 5)
  );

  constructor() {
    void this.loadSlides();
  }

  async loadSlides(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(5);

      if (error) throw error;

      const mappedSlides: HeroSlide[] = (data ?? [])
        .map(slide => ({
          id: slide.id,
          imageDesktop: slide.image_desktop ?? '',
          imageMobile:
            slide.image_mobile || slide.image_desktop || '',
          title: slide.title ?? '',
          subtitle: slide.subtitle ?? '',
          buttonText: slide.button_text ?? '',
          buttonLink: slide.button_link ?? '/#productos',
          active: slide.is_active ?? true,
          position: slide.sort_order ?? 0
        }));

      this.slidesState.set(mappedSlides);

    } catch (error) {
      console.error('Error cargando slider:', error);

      this.error.set(
        'No fue posible cargar las imágenes del slider.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}
