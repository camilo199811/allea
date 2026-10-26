
import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  StoreSettingsService
} from '../../services/store-settings';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  private readonly storeSettings =
    inject(StoreSettingsService);

  currentYear = new Date().getFullYear();

  instagramUrl = computed(
    () => this.storeSettings.settings().instagramUrl
  );
}
