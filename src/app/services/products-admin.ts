
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export interface AdminProduct {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface CreateProduct {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  is_active: boolean;
  is_featured: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsAdminService {

  private readonly supabase = inject(SupabaseService);

  async getProducts(): Promise<AdminProduct[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as AdminProduct[];
  }

  async createProduct(
    product: CreateProduct
  ): Promise<AdminProduct> {

    const { data, error } = await this.supabase.client
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;

    return data as AdminProduct;
  }

  async updateProduct(
    id: string,
    changes: Partial<CreateProduct>
  ): Promise<AdminProduct> {

    const { data, error } = await this.supabase.client
      .from('products')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as AdminProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
