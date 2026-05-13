import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Product, ProductService } from '../products/product.service';
import { PosService } from './pos.service';
import { ToastService } from '../../shared/services/toast.service';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ReceiptPrintService } from '../sales/receipt-print.service';
import { Sale, SaleService } from '../sales/sale.service';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    NgOptimizedImage,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="flex h-[calc(100vh-120px)] gap-6">
      
      <!-- Catalog Section (Left) -->
      <div class="w-2/3 flex flex-col gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Buscar producto (Nombre o Código)</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            [formControl]="searchControl"
            placeholder="Ej. Camiseta"
            (keydown.enter)="handleSearchEnter($event)" />
        </mat-form-field>

        <div class="flex-1 overflow-auto grid grid-cols-3 auto-rows-[220px] gap-4 pb-4">
          @for (product of products(); track product.id) {
            <mat-card class="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-[220px]" (click)="addToCart(product)">
              <div class="h-32 min-h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden border-b border-gray-100 p-2">
                @if (hasProductImage(product)) {
                  <img [ngSrc]="product.imageUrl!" fill class="object-contain p-2" [alt]="product.name" (error)="markImageAsFailed(product.imageUrl)">
                } @else {
                  <mat-icon class="!text-gray-300 !text-5xl !w-12 !h-12">image</mat-icon>
                }
              </div>
              <mat-card-content class="!p-3 flex flex-col items-center justify-center text-center h-[92px]">
                <div class="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{{ product.name }}</div>
                <div class="font-medium text-indigo-600">{{ product.salePrice | currency }}</div>
                <div class="text-[10px] text-gray-400 mt-1">Stock: {{ product.stockQuantity }}</div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="col-span-3 text-center text-gray-500 mt-10">No se encontraron productos.</div>
          }
        </div>
      </div>

      <!-- Cart Section (Right) -->
      <div class="w-1/3 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <mat-icon>shopping_cart</mat-icon> Carrito
          </h2>
        </div>

        <div class="flex-1 overflow-auto p-4 flex flex-col gap-4">
          @for (item of cartItems(); track item.product.id) {
            <div class="flex flex-col gap-2 p-3 border border-gray-200 rounded bg-gray-50">
              <div class="flex gap-3">
                @if (hasProductImage(item.product)) {
                  <div class="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0 relative bg-white p-1">
                    <img [ngSrc]="item.product.imageUrl!" fill class="object-contain p-1" [alt]="item.product.name" (error)="markImageAsFailed(item.product.imageUrl)">
                  </div>
                } @else {
                  <div class="w-12 h-12 rounded border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white">
                    <mat-icon class="!text-gray-300">image</mat-icon>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <div class="min-w-0">
                      <div class="font-bold text-gray-800 text-sm truncate">{{ item.product.name }}</div>
                      <div class="text-[10px] text-gray-500">Disp: {{ item.product.stockQuantity }}</div>
                    </div>
                    <button mat-icon-button color="warn" class="!w-6 !h-6 !leading-none flex-shrink-0" (click)="posService.removeItem(item.product.id)">
                      <mat-icon class="!text-[18px]">delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-between items-center mt-1">
                <div class="flex items-center gap-2">
                  <button mat-icon-button (click)="posService.updateQuantity(item.product.id, item.quantity - 1)">
                    <mat-icon>remove_circle_outline</mat-icon>
                  </button>
                  <span class="font-bold w-6 text-center">{{ item.quantity }}</span>
                  <button mat-icon-button (click)="posService.updateQuantity(item.product.id, item.quantity + 1)">
                    <mat-icon>add_circle_outline</mat-icon>
                  </button>
                </div>
                <div class="font-bold text-indigo-600">
                  {{ (item.pricingMode === 'sale' ? item.product.salePrice : item.product.regularPrice) | currency }}
                </div>
              </div>

              <!-- Pricing Mode Toggle (only if regular != sale) -->
              @if (item.product.regularPrice !== item.product.salePrice) {
                <mat-button-toggle-group 
                  [value]="item.pricingMode" 
                  (change)="posService.updatePricingMode(item.product.id, $event.value)"
                  class="w-full mt-2 !h-10"
                  hideSingleSelectionIndicator>
                  <mat-button-toggle value="regular" class="w-1/2 text-xs flex items-center justify-center">Normal</mat-button-toggle>
                  <mat-button-toggle value="sale" class="w-1/2 text-xs flex items-center justify-center">Oferta</mat-button-toggle>
                </mat-button-toggle-group>
              }
            </div>
          } @empty {
            <div class="text-center text-gray-500 mt-10">El carrito está vacío.</div>
          }
        </div>

        <!-- Totals & Checkout -->
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-600 font-medium">Subtotal</span>
            <span class="font-bold">{{ posService.subtotal() | currency }}</span>
          </div>
          
          <div class="flex items-center gap-2 mb-4">
            <mat-form-field appearance="outline" class="w-full !mb-[-1.25em]">
              <mat-label>Descuento Global ($)</mat-label>
              <input matInput type="number" min="0" [formControl]="discountControl" />
            </mat-form-field>
          </div>

          <div class="flex justify-between items-center mb-4">
            <span class="text-xl font-bold text-gray-800">Total</span>
            <span class="text-2xl font-bold text-indigo-600">{{ posService.total() | currency }}</span>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <mat-form-field appearance="outline" class="w-full !mb-[-1.25em]">
              <mat-label>Dinero recibido ($)</mat-label>
              <input matInput type="number" min="0" [formControl]="cashReceivedControl" />
            </mat-form-field>
          </div>

          <div
            class="flex justify-between items-center mb-4 rounded border px-3 py-2 text-sm font-semibold"
            [class.border-emerald-200]="!hasInsufficientCash()"
            [class.bg-emerald-50]="!hasInsufficientCash()"
            [class.text-emerald-700]="!hasInsufficientCash()"
            [class.border-red-200]="hasInsufficientCash()"
            [class.bg-red-50]="hasInsufficientCash()"
            [class.text-red-700]="hasInsufficientCash()">
            @if (hasInsufficientCash()) {
              <span>Faltan</span>
              <span>{{ cashMissing() | currency }}</span>
            } @else {
              <span>Cambio</span>
              <span>{{ changeDue() | currency }}</span>
            }
          </div>

          <button mat-flat-button color="primary" class="w-full !h-12 !text-lg" [disabled]="isCheckoutDisabled()" (click)="checkout()">
            Cobrar
          </button>
        </div>

      </div>
    </div>
  `
})
export class PosComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly posService = inject(PosService);
  private readonly toast = inject(ToastService);
  private readonly receiptPrintService = inject(ReceiptPrintService);
  private readonly saleService = inject(SaleService);

  searchControl = new FormControl('');
  discountControl = new FormControl<number | null>(null);
  cashReceivedControl = new FormControl<number | null>(null);
  
  products = signal<Product[]>([]);
  isProcessing = signal(false);
  failedImageUrls = signal<Set<string>>(new Set());

  cartItems = this.posService.cartItems;

  ngOnInit() {
    this.loadProducts('');

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => this.loadProducts(val || ''));

    this.discountControl.valueChanges.subscribe(val => {
      this.posService.setGlobalDiscount(Number(val) || 0);
    });

    // Reset cart on init
    this.posService.clearCart();
    this.discountControl.setValue(null, { emitEvent: false });
    this.cashReceivedControl.setValue(null, { emitEvent: false });
  }

  loadProducts(search: string) {
    this.productService.getAll({ search, isActive: true, limit: 50 }).subscribe(res => {
      this.products.set(res.data);
    });
  }

  addToCart(product: Product) {
    this.posService.addToCart(product);
  }

  handleSearchEnter(event: Event): void {
    event.preventDefault();

    const scannedCode = this.normalizeBarcode(this.searchControl.value);
    if (!scannedCode) return;

    const loadedProduct = this.products().find(product => this.matchesBarcode(product, scannedCode));
    if (loadedProduct) {
      this.addScannedProduct(loadedProduct);
      return;
    }

    this.productService.getAll({ search: scannedCode, isActive: true, limit: 50 }).subscribe({
      next: (res) => {
        const product = res.data.find(item => this.matchesBarcode(item, scannedCode));

        if (!product) {
          this.toast.error('No se encontró un producto con ese código de barras.');
          return;
        }

        this.addScannedProduct(product);
      },
      error: () => {
        this.toast.error('No se pudo buscar el producto escaneado.');
      }
    });
  }

  hasProductImage(product: Product): boolean {
    const imageUrl = product.imageUrl?.trim();
    return !!imageUrl && !this.failedImageUrls().has(imageUrl);
  }

  markImageAsFailed(imageUrl: string | null): void {
    const normalizedUrl = imageUrl?.trim();
    if (!normalizedUrl) return;

    this.failedImageUrls.update(urls => new Set(urls).add(normalizedUrl));
  }

  cashReceived(): number {
    return Number(this.cashReceivedControl.value) || 0;
  }

  cashMissing(): number {
    return Math.max(0, this.posService.total() - this.cashReceived());
  }

  changeDue(): number {
    if (this.cartItems().length === 0 || this.posService.total() === 0) {
      return 0;
    }

    return Math.max(0, this.cashReceived() - this.posService.total());
  }

  hasInsufficientCash(): boolean {
    return this.cartItems().length > 0 && this.cashReceived() < this.posService.total();
  }

  isCheckoutDisabled(): boolean {
    return this.cartItems().length === 0 || this.isProcessing() || this.hasInsufficientCash();
  }

  private addScannedProduct(product: Product): void {
    this.addToCart(product);
    this.searchControl.setValue('', { emitEvent: false });
    this.loadProducts('');
  }

  private matchesBarcode(product: Product, barcode: string): boolean {
    return (
      this.normalizeBarcode(product.barcode) === barcode ||
      this.normalizeBarcode(product.legacyCodigoBarras) === barcode
    );
  }

  private normalizeBarcode(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  checkout() {
    if (this.isCheckoutDisabled()) {
      if (this.hasInsufficientCash()) {
        this.toast.error('El dinero recibido es menor al total de la venta.');
      }
      return;
    }

    this.isProcessing.set(true);
    this.posService.checkout().subscribe({
      next: (sale) => {
        this.posService.clearCart();
        this.discountControl.setValue(null);
        this.cashReceivedControl.setValue(null);
        this.isProcessing.set(false);
        // Reload products to get updated stock
        this.loadProducts(this.searchControl.value || '');
        this.printCreatedSale(sale);
      },
      error: (err) => {
        this.isProcessing.set(false);
        if (err.status === 400 && err.error?.error) {
          this.toast.error(err.error.error);
        } else {
          this.toast.error('Ocurrió un error al procesar la venta.');
        }
      }
    });
  }

  private printCreatedSale(sale: Sale): void {
    const printSale = (saleToPrint: Sale) => {
      this.receiptPrintService.printSale(saleToPrint).subscribe({
        next: () => {
          this.toast.success('Venta registrada e impresa con éxito.');
        },
        error: () => {
          this.toast.warning('Venta registrada, pero no se pudo imprimir el ticket.');
        }
      });
    };

    if (sale.items?.length) {
      printSale(sale);
      return;
    }

    this.saleService.getById(sale.id).subscribe({
      next: printSale,
      error: () => {
        this.toast.warning('Venta registrada, pero no se pudo imprimir el ticket.');
      }
    });
  }
}
