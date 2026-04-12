import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../categories/category.service';

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  productNameSnapshot: string;
  productBarcodeSnapshot: string;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
}

export interface Sale {
  id: string;
  occurredAt: string;
  createdByUserId: string;
  subtotal: string;
  discountTotal: string;
  total: string;
  hasDiscount: boolean;
  notes: string | null;
  status: 'completed' | 'cancelled';
  cancelledAt: string | null;
  cancelledByUserId: string | null;
  cancellationReason: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  totalSold: string;
  subtotal: string;
  discountTotal: string;
  tickets: number;
  totalUnits: number;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  getSummary(params?: { from?: string; to?: string }): Observable<SalesSummary> {
    return new Observable<SalesSummary>(subscriber => {
      subscriber.next({
        totalSold: '15000.50',
        subtotal: '16000.00',
        discountTotal: '999.50',
        tickets: 145,
        totalUnits: 312
      });
      subscriber.complete();
    });
  }

  getAll(params?: any): Observable<PaginatedResponse<Sale>> {
    return new Observable<PaginatedResponse<Sale>>(subscriber => {
      subscriber.next({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      });
      subscriber.complete();
    });
  }

  getById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  cancel(id: string, reason: string): Observable<Sale> {
    return this.http.post<Sale>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}
