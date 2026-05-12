import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sale } from './sale.service';

export interface ReceiptItem {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface ReceiptPayload {
  saleId: string;
  occurredAt: string;
  hasDiscount: boolean;
  subtotal: number;
  discountTotal: number;
  total: number;
  data: ReceiptItem[];
}

@Injectable({ providedIn: 'root' })
export class ReceiptPrintService {
  private readonly http = inject(HttpClient);

  printSale(sale: Sale): Observable<unknown> {
    return this.http.post(environment.receiptPrintUrl, this.toReceiptPayload(sale));
  }

  reprintSale(sale: Sale): Observable<unknown> {
    return this.http.post(environment.receiptReprintUrl, this.toReceiptPayload(sale));
  }

  private toReceiptPayload(sale: Sale): ReceiptPayload {
    return {
      saleId: sale.id,
      occurredAt: sale.occurredAt,
      hasDiscount: sale.hasDiscount,
      subtotal: Number(sale.subtotal),
      discountTotal: Number(sale.discountTotal),
      total: Number(sale.total),
      data: sale.items.map(item => ({
        nombre: item.productNameSnapshot,
        cantidad: item.quantity,
        precio: Number(item.unitPrice),
        subtotal: Number(item.lineTotal)
      }))
    };
  }
}
