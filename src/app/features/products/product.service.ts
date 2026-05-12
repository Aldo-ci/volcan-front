import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../categories/category.service';
import { PaginatedResponse } from '../../shared/models/paginated-response.model';
import { fetchAllPages } from '../../shared/utils/fetch-all-pages.util';

export interface Product {
  id: string;
  legacyCodigoBarras: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  category: Category;
  regularPrice: string;
  salePrice: string;
  stockQuantity: number;
  minimumStock: number;
  color: string | null;
  size: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  getAll(params?: any): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(this.baseUrl, { params });
  }

  getAllUnpaginated(): Observable<Product[]> {
    return fetchAllPages((params) => this.getAll(params), { limit: 100 });
  }

  getLowStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/low-stock`);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(data: any): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, data);
  }

  update(id: string, data: any): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
