
import { Component } from '@angular/core';

import { Header } from '../../components/header/header';
import { HeroSlider } from '../../components/hero-slider/hero-slider';
import { Categories } from '../../components/categories/categories';
import { ProductCatalog } from '../../components/product-catalog/product-catalog';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Header,
    HeroSlider,
    Categories,
    ProductCatalog,
    Footer
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {}
