
import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  StoreSettingsService
} from '../../services/store-settings';

@Component({
  selector: 'app-admin-store-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-store-settings.html',
  styleUrl: './admin-store-settings.scss'
})
export class AdminStoreSettings implements OnInit {

  private readonly settingsService =
    inject(StoreSettingsService);

  whatsappNumber = signal('');
  instagramUrl = signal('');

  loading = signal(false);
  saving = signal(false);

  error = signal('');
  success = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await this.settingsService.loadSettings();

      if (this.settingsService.error()) {
        throw new Error(this.settingsService.error());
      }

      const settings = this.settingsService.settings();

      this.whatsappNumber.set(settings.whatsappNumber);
      this.instagramUrl.set(settings.instagramUrl);

    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la configuración.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await this.settingsService.saveSettings({
        whatsappNumber: this.whatsappNumber(),
        instagramUrl: this.instagramUrl()
      });

      this.success.set(
        'Configuración actualizada correctamente.'
      );

    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la configuración.'
      );
    } finally {
      this.saving.set(false);
    }
  }
}
