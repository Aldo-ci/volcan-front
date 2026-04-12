import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, PaginatedResponse } from '../categories/category.service';

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
    return new Observable<PaginatedResponse<Product>>(subscriber => {
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

  getLowStock(): Observable<Product[]> {
    return new Observable<Product[]>(subscriber => {
      subscriber.next([
        {
          id: '1',
          name: 'Producto A',
          stockQuantity: 5,
          minimumStock: 10,
          barcode: '123456',
          legacyCodigoBarras: null,
          description: null,
          imageUrl: null,
          categoryId: '1',
          category: { id: '1', name: 'Cat 1', description: null, createdAt: '', updatedAt: '' },
          regularPrice: '100',
          salePrice: '90',
          color: null,
          size: null,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        }
      ]);
      subscriber.complete();
    });
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
