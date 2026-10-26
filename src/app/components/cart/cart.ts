
import {
  Component,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Cart as CartService } from '../../services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

  cart = inject(CartService);

  items = this.cart.items;
  totalItems = this.cart.totalItems;
  totalPrice = this.cart.totalPrice;

  open = input(false);
  closed = output<void>();

  // Control de inventario
  stockWarningVariantId = signal<string | null>(null);

  // Pasos del carrito
  checkoutStep = signal<'cart' | 'shipping'>('cart');

  // Datos del cliente
  customerName = signal('');
  customerPhone = signal('');
  department = signal('');
  city = signal('');
  neighborhood = signal('');
  address = signal('');
  deliveryNotes = signal('');

  // Aceptación de condiciones
  acceptsShippingTerms = signal(false);

  close(): void {
    this.stockWarningVariantId.set(null);
    this.checkoutStep.set('cart');
    this.closed.emit();
  }

  // ========================================
  // INVENTARIO
  // ========================================

  increaseQuantity(
    productId: string,
    variantId: string
  ): void {

    if (!this.cart.canIncrease(productId, variantId)) {
      this.stockWarningVariantId.set(variantId);
      return;
    }

    this.cart.increase(productId, variantId);

    if (!this.cart.canIncrease(productId, variantId)) {
      this.stockWarningVariantId.set(variantId);
    } else {
      this.stockWarningVariantId.set(null);
    }
  }

  decreaseQuantity(
    productId: string,
    variantId: string
  ): void {

    this.cart.decrease(productId, variantId);

    if (this.stockWarningVariantId() === variantId) {
      this.stockWarningVariantId.set(null);
    }
  }

  removeItem(
    productId: string,
    variantId: string
  ): void {

    this.cart.remove(productId, variantId);

    if (this.stockWarningVariantId() === variantId) {
      this.stockWarningVariantId.set(null);
    }
  }

  getStock(
    productId: string,
    variantId: string
  ): number {
    return this.cart.getStock(productId, variantId);
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================

  continueToShipping(): void {
    if (!this.items().length) return;

    this.checkoutStep.set('shipping');
  }

  backToCart(): void {
    this.checkoutStep.set('cart');
  }

  // ========================================
  // VALIDACIÓN DE DATOS
  // ========================================

 
isShippingValid(): boolean {
  const phone = this.customerPhone()
    .replace(/\s/g, '')
    .trim();

  return (
    this.customerName().trim().length >= 3 &&
    /^3\d{9}$/.test(phone) &&
    this.department().trim().length >= 2 &&
    this.city().trim().length >= 2 &&
    this.neighborhood().trim().length >= 2 &&
    this.address().trim().length >= 5 &&
    this.acceptsShippingTerms()
  );
}

// Indica qué falta para continuar
shippingValidationMessage(): string {

  if (this.customerName().trim().length < 3) {
    return 'Ingresa tu nombre completo.';
  }

  const phone = this.customerPhone()
    .replace(/\s/g, '')
    .trim();

  if (!/^3\d{9}$/.test(phone)) {
    return 'Ingresa un celular colombiano válido de 10 dígitos que comience por 3.';
  }

  if (this.department().trim().length < 2) {
    return 'Ingresa tu departamento.';
  }

  if (this.city().trim().length < 2) {
    return 'Ingresa tu ciudad o municipio.';
  }

  if (this.neighborhood().trim().length < 2) {
    return 'Ingresa tu barrio.';
  }

  if (this.address().trim().length < 5) {
    return 'Ingresa una dirección de entrega válida.';
  }

  if (!this.acceptsShippingTerms()) {
    return 'Debes aceptar las condiciones de envío y pago.';
  }

  return '';
}


  // ========================================
  // ENVIAR PEDIDO A WHATSAPP
  // ========================================

 
sendWhatsApp(): void {

  if (
    !this.items().length ||
    !this.isShippingValid()
  ) {
    return;
  }

  // Reemplazar por el número oficial de ALLÉA
  const phone = '573150543250';

  // ========================================
  // FORMATO DE LOS PRODUCTOS
  // ========================================

  const productsText = this.items()
    .map((item, index) => {

      const details = [
        `*${index + 1}. ${item.name}*`,

        item.color
          ? `🎨 Color: ${item.color}`
          : '',

        item.size
          ? `📏 Talla: ${item.size}`
          : '',

        item.flavor
          ? `Sabor: ${item.flavor}`
          : '',

        item.presentation
          ? `Presentación: ${item.presentation}`
          : '',

        `Cantidad: ${item.quantity}`,

        `Subtotal: $${(
          item.price * item.quantity
        ).toLocaleString('es-CO')}`
      ];

      return details
        .filter(Boolean)
        .join('\n');

    })
    .join('\n\n────────────────\n\n');

  // ========================================
  // MENSAJE COMPLETO
  // ========================================

  const message = [
    '¡Hola, ALLÉA! 🤍',
    '',
    'Quiero realizar el siguiente pedido:',
    '',
    '🛍️ *MI PEDIDO*',
    '',
    productsText,
    '',
    '━━━━━━━━━━━━━━━━',
    '',
    '💰 *RESUMEN DE COMPRA*',
    '',
    `Subtotal de productos: $${this.totalPrice().toLocaleString('es-CO')}`,
    '🚚 Envío: *Pendiente por cotizar*',
    '',
    '━━━━━━━━━━━━━━━━',
    '',
    '📍 *DATOS DE ENTREGA*',
    '',
    `👤 Nombre: ${this.customerName().trim()}`,
    `📱 Celular: ${this.customerPhone().trim()}`,
    `Departamento: ${this.department().trim()}`,
    `Ciudad: ${this.city().trim()}`,
    `Barrio: ${this.neighborhood().trim()}`,
    `🏠 Dirección: ${this.address().trim()}`,
    this.deliveryNotes().trim()
      ? `📝 Indicaciones: ${this.deliveryNotes().trim()}`
      : '',
    '',
    '━━━━━━━━━━━━━━━━',
    '',
    '📦 *CONDICIONES DE ENVÍO*',
    '',
    'Confirmo que el envío se cotiza por separado y que no se acepta pago contraentrega fuera del Área Metropolitana de Bucaramanga.',
    '',
    '✨ ¿Me confirman el valor total de mi pedido y los medios de pago disponibles?'
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n');

  // ========================================
  // ABRIR WHATSAPP
  // ========================================

  const url = `https://wa.me/${phone}?text=${
    encodeURIComponent(message)
  }`;

  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  );
}

}
