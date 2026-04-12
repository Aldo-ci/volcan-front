import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: string;
  legacyProductTypeId: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/product-categories`;

  getAll(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(this.baseUrl, { params: params as any });
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.baseUrl}/${id}`, data);
  }
}
