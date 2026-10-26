
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HeroSlide } from '../../models/hero-slide.model';
import {
  HeroSlidesAdminService
} from '../../services/hero-slides-admin';
import { HeroSlidesService } from '../../services/hero-slides';

@Component({
  selector: 'app-admin-hero-slides',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-hero-slides.html',
  styleUrl: './admin-hero-slides.scss'
})
export class AdminHeroSlides implements OnInit, OnDestroy {

  private readonly admin = inject(HeroSlidesAdminService);
  private readonly publicSlides = inject(HeroSlidesService);

  slides = signal<HeroSlide[]>([]);
  loading = signal(false);
  saving = signal(false);
  processing = signal(false);
  error = signal('');
  success = signal('');

  editingId = signal<string | null>(null);
  showForm = signal(false);

  title = signal('');
  subtitle = signal('');
  buttonText = signal('');
  buttonLink = signal('/#productos');
  position = signal(1);
  active = signal(true);

  desktopUrl = signal('');
  mobileUrl = signal('');

  desktopFile = signal<File | null>(null);
  mobileFile = signal<File | null>(null);

  desktopPreview = signal('');
  mobilePreview = signal('');

  activeCount = computed(() =>
    this.slides().filter(slide => slide.active).length
  );

  sortedSlides = computed(() =>
    [...this.slides()].sort(
      (a, b) => a.position - b.position
    )
  );

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.slides.set(await this.admin.getSlides());
    } catch (error) {
      this.error.set(this.getError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private clearPreviews(): void {
    if (this.desktopPreview()) {
      URL.revokeObjectURL(this.desktopPreview());
    }

    if (this.mobilePreview()) {
      URL.revokeObjectURL(this.mobilePreview());
    }

    this.desktopPreview.set('');
    this.mobilePreview.set('');
  }

  newSlide(): void {
    this.clearPreviews();

    this.editingId.set(null);
    this.title.set('');
    this.subtitle.set('');
    this.buttonText.set('');
    this.buttonLink.set('/#productos');
    this.position.set(
      Math.max(0, ...this.slides().map(s => s.position)) + 1
    );
    this.active.set(this.activeCount() < 5);
    this.desktopUrl.set('');
    this.mobileUrl.set('');
    this.desktopFile.set(null);
    this.mobileFile.set(null);
    this.error.set('');
    this.success.set('');
    this.showForm.set(true);
  }

  editSlide(slide: HeroSlide): void {
    this.clearPreviews();

    this.editingId.set(slide.id);
    this.title.set(slide.title);
    this.subtitle.set(slide.subtitle);
    this.buttonText.set(slide.buttonText);
    this.buttonLink.set(slide.buttonLink);
    this.position.set(slide.position);
    this.active.set(slide.active);
    this.desktopUrl.set(slide.imageDesktop);
    this.mobileUrl.set(slide.imageMobile);
    this.desktopFile.set(null);
    this.mobileFile.set(null);
    this.error.set('');
    this.success.set('');
    this.showForm.set(true);
  }

  onFileSelected(
    event: Event,
    type: 'desktop' | 'mobile'
  ): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0] ?? null;

    if (type === 'desktop') {
      if (this.desktopPreview()) {
        URL.revokeObjectURL(this.desktopPreview());
      }

      this.desktopFile.set(file);
      this.desktopPreview.set(
        file ? URL.createObjectURL(file) : ''
      );
    } else {
      if (this.mobilePreview()) {
        URL.revokeObjectURL(this.mobilePreview());
      }

      this.mobileFile.set(file);
      this.mobilePreview.set(
        file ? URL.createObjectURL(file) : ''
      );
    }
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    if (!this.title().trim()) {
      this.error.set('Ingresa un título.');
      return;
    }

    if (!this.desktopUrl() && !this.desktopFile()) {
      this.error.set('Selecciona la imagen para computador.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    try {
      let desktop = this.desktopUrl();
      let mobile = this.mobileUrl();

      if (this.desktopFile()) {
        desktop = await this.admin.uploadImage(
          this.desktopFile()!
        );
      }

      if (this.mobileFile()) {
        mobile = await this.admin.uploadImage(
          this.mobileFile()!
        );
      }

      await this.admin.saveSlide({
        title: this.title(),
        subtitle: this.subtitle(),
        imageDesktop: desktop,
        imageMobile: mobile || desktop,
        buttonText: this.buttonText(),
        buttonLink: this.buttonLink(),
        active: this.active(),
        position: Number(this.position())
      }, this.editingId() ?? undefined);

      await this.load();
      await this.publicSlides.loadSlides();

      this.clearPreviews();
      this.showForm.set(false);
      this.success.set('Banner guardado correctamente.');

    } catch (error) {
      this.error.set(this.getError(error));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(slide: HeroSlide): Promise<void> {
    if (this.processing()) return;

    if (!slide.active && this.activeCount() >= 5) {
      this.error.set(
        'Ya tienes 5 banners activos. Desactiva uno primero.'
      );
      return;
    }

    this.processing.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const { id, ...data } = slide;

      await this.admin.saveSlide({
        ...data,
        active: !slide.active
      }, id);

      await this.load();
      await this.publicSlides.loadSlides();

      this.success.set('Estado del banner actualizado.');
    } catch (error) {
      this.error.set(this.getError(error));
    } finally {
      this.processing.set(false);
    }
  }

  async moveSlide(
    slide: HeroSlide,
    direction: -1 | 1
  ): Promise<void> {
    if (this.processing()) return;

    const ordered = this.sortedSlides();
    const index = ordered.findIndex(s => s.id === slide.id);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 ||
        targetIndex >= ordered.length) return;

    const other = ordered[targetIndex];

    this.processing.set(true);
    this.error.set('');
    this.success.set('');

    try {
      // Posiciones temporales para evitar duplicados.
      const originalPosition = slide.position;
      const otherPosition = other.position;

      // Si hay posiciones repetidas, normalizar primero.
      if (originalPosition === otherPosition) {
        throw new Error(
          'Hay banners con el mismo orden. ' +
          'Edita sus posiciones para que sean diferentes.'
        );
      }

      const { id: slideId, ...slideData } = slide;
      const { id: otherId, ...otherData } = other;

      await this.admin.saveSlide({
        ...slideData,
        position: otherPosition
      }, slideId);

      await this.admin.saveSlide({
        ...otherData,
        position: originalPosition
      }, otherId);

      await this.load();
      await this.publicSlides.loadSlides();

      this.success.set('Orden actualizado.');
    } catch (error) {
      this.error.set(this.getError(error));
      await this.load();
    } finally {
      this.processing.set(false);
    }
  }

  async remove(slide: HeroSlide): Promise<void> {
    if (this.processing()) return;

    if (!window.confirm(
      `¿Eliminar el banner "${slide.title}"?`
    )) return;

    this.processing.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await this.admin.deleteSlide(slide.id);
      await this.load();
      await this.publicSlides.loadSlides();
      this.success.set('Banner eliminado correctamente.');
    } catch (error) {
      this.error.set(this.getError(error));
    } finally {
      this.processing.set(false);
    }
  }

  cancel(): void {
    this.clearPreviews();
    this.showForm.set(false);
    this.error.set('');
  }

  private getError(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Ocurrió un error. Intenta nuevamente.';
  }
}
