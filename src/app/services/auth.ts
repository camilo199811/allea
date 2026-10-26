
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  async login(email: string, password: string) {
    return this.supabase.client.auth.signInWithPassword({
      email,
      password
    });
  }

  async logout() {
    return this.supabase.client.auth.signOut();
  }

  async isAdmin(): Promise<boolean> {
    const { data: userData, error: userError } =
      await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      return false;
    }

    const { data, error } = await this.supabase.client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    return !error && !!data;
  }
}
