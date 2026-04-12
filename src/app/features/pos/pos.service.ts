import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../products/product.service';
import { ToastService } from '../../shared/services/toast.service';

export interface CartItem {
  product: Product;
  quantity: number;
  pricingMode: 'regular' | 'sale';
}

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  // Cart State
  private readonly cartItemsSignal = signal<CartItem[]>([]);
  private readonly globalDiscountSignal = signal<number>(0);

  // Selectors
  readonly cartItems = computed(() => this.cartItemsSignal());
  readonly globalDiscount = computed(() => this.globalDiscountSignal());

  readonly subtotal = computed(() => {
    return this.cartItemsSignal().reduce((acc, item) => {
      const price = item.pricingMode === 'sale' 
        ? Number(item.product.salePrice) 
        : Number(item.product.regularPrice);
      return acc + (price * item.quantity);
    }, 0);
  });

  readonly total = computed(() => {
    return Math.max(0, this.subtotal() - this.globalDiscountSignal());
  });

  // Actions
  addToCart(product: Product) {
    if (!product.isActive) {
      this.toast.error('Producto inactivo, no se puede vender.');
      return;
    }

    if (product.stockQuantity <= 0) {
      this.toast.error('Sin stock suficiente.');
      return;
    }

    this.cartItemsSignal.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          this.toast.error('No hay más stock disponible para este producto.');
          return items;
        }
        return items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      
      // Default to sale price if available (it always is, based on business rules)
      return [...items, { product, quantity: 1, pricingMode: 'sale' }];
    });
  }

  updateQuantity(productId: string, quantity: number) {
    this.cartItemsSignal.update(items => {
      const item = items.find(i => i.product.id === productId);
      if (!item) return items;

      if (quantity > item.product.stockQuantity) {
        this.toast.error(`Solo hay ${item.product.stockQuantity} unidades de ${item.product.name}`);
        return items;
      }

      if (quantity <= 0) {
        return items.filter(i => i.product.id !== productId);
      }

      return items.map(i => i.product.id === productId ? { ...i, quantity } : i);
    });
  }

  updatePricingMode(productId: string, mode: 'regular' | 'sale') {
    this.cartItemsSignal.update(items => 
      items.map(i => i.product.id === productId ? { ...i, pricingMode: mode } : i)
    );
  }

  removeItem(productId: string) {
    this.cartItemsSignal.update(items => items.filter(i => i.product.id !== productId));
  }

  setGlobalDiscount(amount: number) {
    if (amount > this.subtotal()) {
      this.toast.error('El descuento no puede ser mayor al subtotal.');
      return;
    }
    this.globalDiscountSignal.set(amount);
  }

  clearCart() {
    this.cartItemsSignal.set([]);
    this.globalDiscountSignal.set(0);
  }

  checkout(notes: string = ''): Observable<any> {
    const items = this.cartItemsSignal().map(i => ({
      productId: i.product.id,
      quantity: i.quantity,
      pricingMode: i.pricingMode
    }));

    const payload = {
      occurredAt: new Date().toISOString(),
      discountTotal: this.globalDiscountSignal(),
      notes,
      items
    };

    return this.http.post(`${environment.apiUrl}/sales`, payload);
  }
}
