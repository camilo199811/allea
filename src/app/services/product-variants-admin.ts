
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

export interface ProductVariant {
  id: string;
  product_id: string;
  color_name: string | null;
  color_hex: string | null;
  size: string | null;
  flavor: string | null;
  presentation: string | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  sort_order: number;
}

export type CreateVariant = Omit<
  ProductVariant,
  'id'
>;

@Injectable({
  providedIn: 'root'
})
export class ProductVariantsAdminService {
  private readonly supabase = inject(SupabaseService);

  async getVariants(
    productId: string
  ): Promise<ProductVariant[]> {
    const { data, error } = await this.supabase.client
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order')
      .order('created_at');

    if (error) throw error;

    return (data ?? []) as ProductVariant[];
  }

  async createVariant(
    variant: CreateVariant
  ): Promise<ProductVariant> {
    const { data, error } = await this.supabase.client
      .from('product_variants')
      .insert(variant)
      .select()
      .single();

    if (error) throw error;

    return data as ProductVariant;
  }

  async updateVariant(
    id: string,
    changes: Partial<CreateVariant>
  ): Promise<ProductVariant> {
    const { data, error } = await this.supabase.client
      .from('product_variants')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as ProductVariant;
  }

  async deleteVariant(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
