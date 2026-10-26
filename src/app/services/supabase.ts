
import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient
} from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabasePublishableKey
    );
  }

  // Verificar inicialización del cliente
  async testConnection(): Promise<boolean> {
    const { error } = await this.client.auth.getSession();

    if (error) {
      console.error(
        'Error de sesión Supabase:',
        error.message
      );
      return false;
    }

    console.log(
      'Cliente Supabase inicializado correctamente'
    );

    return true;
  }


  
async verificarProductos(): Promise<void> {
  const { data, error } = await this.client
    .from('products')
    .select('id, name, price, is_active')
    .limit(5);

  if (error) {
    console.error(
      'Error consultando productos:',
      error.message
    );
    return;
  }

  console.log(
    'Consulta de productos exitosa:',
    data
  );
}

  // Verificar lectura real desde la base de datos
  async verificarServidor(): Promise<void> {
    const { data, error } = await this.client
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(
        'Error consultando Supabase:',
        error.message
      );
      return;
    }

    console.log(
      'Categorías obtenidas desde Supabase:',
      data
    );
  }
}
