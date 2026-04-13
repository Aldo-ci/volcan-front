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
    return this.http.get<SalesSummary>(`${this.baseUrl}/summary`, { params });
  }

  getAll(params?: any): Observable<PaginatedResponse<Sale>> {
    return this.http.get<PaginatedResponse<Sale>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  cancel(id: string, reason: string): Observable<Sale> {
    return this.http.post<Sale>(`${this.baseUrl}/${id}/cancel`, { reason });
  }
}
