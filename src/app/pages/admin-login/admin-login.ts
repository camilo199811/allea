
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  loading = signal(false);
  errorMessage = signal('');

  async iniciarSesion(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { error } = await this.auth.login(
        this.email.trim(),
        this.password
      );

      if (error) {
        this.errorMessage.set(
          'Correo o contraseña incorrectos.'
        );
        return;
      }

      const autorizado = await this.auth.isAdmin();

      if (!autorizado) {
        await this.auth.logout();
        this.errorMessage.set(
          'Esta cuenta no tiene permisos de administrador.'
        );
        return;
      }

      await this.router.navigateByUrl('/admin');

    } catch {
      this.errorMessage.set(
        'No fue posible iniciar sesión. Intenta nuevamente.'
      );
    } finally {
      this.loading.set(false);
    }
  }
  
private readonly authService = inject(AuthService);


async cerrarSesion(): Promise<void> {
  const { error } = await this.authService.logout();

  if (error) {
    console.error(
      'Error cerrando sesión:',
      error.message
    );
    return;
  }

  await this.router.navigateByUrl('/admin/login');
}

}
