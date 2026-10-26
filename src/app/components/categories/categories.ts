
import { Component, inject } from '@angular/core';
import { Categories as CategoriesService } from '../../services/categories';

@Component({
  selector: 'app-categories',
  standalone: true,
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories {
  categoriesService = inject(CategoriesService);

  categories = this.categoriesService.categories;
  selectedCategory = this.categoriesService.selectedCategory;

  selectCategory(slug: string): void {
    const selected = this.selectedCategory();

    this.categoriesService.selectCategory(
      selected === slug ? null : slug
    );

    document.getElementById('productos')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}
