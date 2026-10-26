
import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import { SupabaseService } from './supabase';

export interface StoreSettings {
  whatsappNumber: string;
  instagramUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreSettingsService {

  private readonly supabase = inject(SupabaseService);

  private readonly defaults: StoreSettings = {
    whatsappNumber: '573150543250',
    instagramUrl: 'https://www.instagram.com/allea_sport2/'
  };

  settings = signal<StoreSettings>(this.defaults);
  loading = signal(false);
  error = signal('');

  constructor() {
    void this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const { data, error } = await this.supabase.client
        .from('store_settings')
        .select('whatsapp_number, instagram_url')
        .eq('id', 1)
        .single();

      if (error) throw error;

      this.settings.set({
        whatsappNumber: data.whatsapp_number,
        instagramUrl: data.instagram_url
      });

    } catch (error) {
      console.error(
        'Error cargando configuración:',
        error
      );

      this.error.set(
        'No fue posible cargar la configuración.'
      );

    } finally {
      this.loading.set(false);
    }
  }

  async saveSettings(
    settings: StoreSettings
  ): Promise<void> {

    const whatsappNumber =
      settings.whatsappNumber.replace(/\D/g, '');

    if (!/^57\d{10}$/.test(whatsappNumber)) {
      throw new Error(
        'Ingresa el número de WhatsApp con el formato 57 seguido de 10 dígitos.'
      );
    }

    let instagramUrl: URL;

    try {
      instagramUrl = new URL(settings.instagramUrl.trim());
    } catch {
      throw new Error('Ingresa un enlace válido de Instagram.');
    }

    if (
      instagramUrl.protocol !== 'https:' ||
      !['instagram.com', 'www.instagram.com'].includes(
        instagramUrl.hostname.toLowerCase()
      )
    ) {
      throw new Error('El enlace debe pertenecer a Instagram.');
    }

    const { data, error } = await this.supabase.client
      .from('store_settings')
      .update({
        whatsapp_number: whatsappNumber,
        instagram_url: instagramUrl.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select('whatsapp_number, instagram_url')
      .single();

    if (error) throw error;

    this.settings.set({
      whatsappNumber: data.whatsapp_number,
      instagramUrl: data.instagram_url
    });
  }
}
