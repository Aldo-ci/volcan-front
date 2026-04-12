import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, Role } from '../../core/auth/auth.service';
import { PaginatedResponse } from '../categories/category.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getAll(params?: any): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(this.baseUrl, { params });
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/roles`);
  }

  create(data: any): Observable<User> {
    return this.http.post<User>(this.baseUrl, data);
  }

  update(id: string, data: any): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, data);
  }

  activate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
