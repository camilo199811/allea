
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart as CartService } from '../../services/cart';
import { Cart as CartComponent } from '../cart/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CartComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  private cartService = inject(CartService);

  menuOpen = signal(false);
  searchOpen = signal(false);
  cartOpen = signal(false);

  cartCount = this.cartService.totalItems;

  toggleMenu(): void {
    this.menuOpen.update(value => !value);
  }

  toggleSearch(): void {
    this.searchOpen.update(value => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openCart(): void {
    this.cartOpen.set(true);
  }

  closeCart(): void {
    this.cartOpen.set(false);
  }
}
