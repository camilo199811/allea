
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import { HeroSlidesService } from '../../services/hero-slides';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  templateUrl: './hero-slider.html',
  styleUrl: './hero-slider.scss'
})
export class HeroSlider implements OnInit, OnDestroy {

  private readonly slidesService =
    inject(HeroSlidesService);

  slides = this.slidesService.slides;

  loading = this.slidesService.loading;
  error = this.slidesService.error;

  currentIndex = signal(0);

  activeSlides = computed(() => this.slides());

  currentSlide = computed(
    () => this.activeSlides()[this.currentIndex()]
  );

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const total = this.activeSlides().length;

      if (total === 0 || this.currentIndex() >= total) {
        this.currentIndex.set(0);
      }

      this.restartAutoplay();
    });
  }

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  nextSlide(): void {
    const total = this.activeSlides().length;
    if (!total) return;

    this.currentIndex.update(
      index => (index + 1) % total
    );
  }

  previousSlide(): void {
    const total = this.activeSlides().length;
    if (!total) return;

    this.currentIndex.update(
      index => (index - 1 + total) % total
    );
  }

  goToSlide(index: number): void {
    if (
      index < 0 ||
      index >= this.activeSlides().length
    ) {
      return;
    }

    this.currentIndex.set(index);
    this.restartAutoplay();
  }

  private startAutoplay(): void {
    if (
      this.intervalId ||
      this.activeSlides().length <= 1
    ) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5500);
  }

  private stopAutoplay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private restartAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }
}
