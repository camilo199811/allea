
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  AboutPageService,
  AboutPageContent
} from '../../services/about-page';

type TextField = Exclude<
  keyof AboutPageContent,
  'id' |
  'hero_image' |
  'story_image' |
  'products_image' |
  'detail_one_image' |
  'detail_two_image' |
  'confidence_image' |
  'purpose_image'
>;

type ImageField =
  | 'hero_image'
  | 'story_image'
  | 'products_image'
  | 'detail_one_image'
  | 'detail_two_image'
  | 'confidence_image'
  | 'purpose_image';

interface EditorField {
  key: TextField;
  label: string;
  multiline?: boolean;
}

interface EditorSection {
  title: string;
  description: string;
  fields: EditorField[];
  images: {
    key: ImageField;
    label: string;
  }[];
}

@Component({
  selector: 'app-admin-about-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-about-page.html',
  styleUrl: './admin-about-page.scss'
})
export class AdminAboutPage implements OnInit, OnDestroy {

  private readonly service = inject(AboutPageService);

  draft: AboutPageContent | null = null;

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  activeSection = signal(0);

  private pendingFiles: Partial<Record<ImageField, File>> = {};
  private previews: Partial<Record<ImageField, string>> = {};

  readonly sections: EditorSection[] = [
    {
      title: 'Portada',
      description: 'Presentación de las tres hermanas.',
      fields: [
        { key: 'hero_title', label: 'Título principal' },
        { key: 'hero_highlight', label: 'Título dorado' },
        {
          key: 'hero_description',
          label: 'Descripción',
          multiline: true
        }
      ],
      images: [
        { key: 'hero_image', label: 'Fotografía de portada' }
      ]
    },
    {
      title: 'Quiénes somos',
      description: 'La historia de ALLÉA.',
      fields: [
        { key: 'story_title', label: 'Título principal' },
        { key: 'story_highlight', label: 'Título dorado' },
        {
          key: 'story_paragraph_one',
          label: 'Primer párrafo',
          multiline: true
        },
        {
          key: 'story_paragraph_two',
          label: 'Segundo párrafo',
          multiline: true
        }
      ],
      images: [
        { key: 'story_image', label: 'Fotografía de nuestra historia' }
      ]
    },
    {
      title: 'Nuestros productos',
      description: 'Presentación y detalles de las prendas.',
      fields: [
        { key: 'products_title', label: 'Título principal' },
        { key: 'products_highlight', label: 'Título dorado' },
        {
          key: 'products_description',
          label: 'Descripción',
          multiline: true
        },
        { key: 'detail_one_title', label: 'Primer detalle: título' },
        {
          key: 'detail_one_description',
          label: 'Primer detalle: descripción',
          multiline: true
        },
        { key: 'detail_two_title', label: 'Segundo detalle: título' },
        {
          key: 'detail_two_description',
          label: 'Segundo detalle: descripción',
          multiline: true
        }
      ],
      images: [
        { key: 'products_image', label: 'Fotografía principal' },
        { key: 'detail_one_image', label: 'Primera fotografía de detalle' },
        { key: 'detail_two_image', label: 'Segunda fotografía de detalle' }
      ]
    },
    {
      title: 'Más que ropa',
      description: 'Confianza y beneficios de ALLÉA.',
      fields: [
        { key: 'confidence_title', label: 'Título principal' },
        { key: 'confidence_highlight', label: 'Título dorado' },
        {
          key: 'confidence_description',
          label: 'Descripción',
          multiline: true
        },
        { key: 'benefit_one', label: 'Beneficio 01' },
        { key: 'benefit_two', label: 'Beneficio 02' },
        { key: 'benefit_three', label: 'Beneficio 03' },
        { key: 'benefit_four', label: 'Beneficio 04' }
      ],
      images: [
        { key: 'confidence_image', label: 'Fotografía de beneficios' }
      ]
    },
    {
      title: 'Misión y visión',
      description: 'Propósito y proyección de la marca.',
      fields: [
        {
          key: 'mission',
          label: 'Nuestra misión',
          multiline: true
        },
        {
          key: 'vision',
          label: 'Nuestra visión',
          multiline: true
        },
        { key: 'brand_phrase', label: 'Frase de ALLÉA' }
      ],
      images: [
        { key: 'purpose_image', label: 'Fotografía de fondo' }
      ]
    }
  ];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      await this.service.loadContent();

      if (this.service.error()) {
        throw new Error(this.service.error());
      }

      const content = this.service.content();

      if (!content) {
        throw new Error('No se encontró el contenido de Nosotras.');
      }

      this.clearPreviews();
      this.pendingFiles = {};
      this.draft = { ...content };

    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  getText(key: TextField): string {
    return this.draft?.[key] ?? '';
  }

  setText(key: TextField, value: string): void {
    if (this.draft) {
      this.draft[key] = value;
    }
    this.success.set('');
  }

  imageUrl(key: ImageField): string {
    return this.previews[key] || this.draft?.[key] || '';
  }

  onImageSelected(
    event: Event,
    key: ImageField
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.type)) {
      this.error.set('Solo se permiten imágenes JPG, PNG o WebP.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La imagen no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    if (this.previews[key]) {
      URL.revokeObjectURL(this.previews[key]!);
    }

    this.pendingFiles[key] = file;
    this.previews[key] = URL.createObjectURL(file);

    this.error.set('');
    this.success.set('');
    input.value = '';
  }

  removeImage(key: ImageField): void {
    if (!this.draft) return;

    if (this.previews[key]) {
      URL.revokeObjectURL(this.previews[key]!);
    }

    delete this.previews[key];
    delete this.pendingFiles[key];

    this.draft[key] = null;
    this.success.set('');
  }

  private clearPreviews(): void {
    Object.values(this.previews).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });

    this.previews = {};
  }

  async save(): Promise<void> {
    if (!this.draft || this.saving()) return;

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const updated: AboutPageContent = {
        ...this.draft
      };

      const imageFields = Object.keys(
        this.pendingFiles
      ) as ImageField[];

      for (const key of imageFields) {
        const file = this.pendingFiles[key];

        if (!file) continue;

        updated[key] = await this.service.uploadImage(
          file,
          key
        );
      }

      await this.service.saveContent(updated);

      this.draft = { ...updated };

      this.clearPreviews();
      this.pendingFiles = {};

      this.success.set(
        '¡Página Nosotras actualizada correctamente!'
      );

    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Ocurrió un error. Intenta nuevamente.';
  }
}
