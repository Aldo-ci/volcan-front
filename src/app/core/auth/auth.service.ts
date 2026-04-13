import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

export interface Role {
  id: string;
  code: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  roleId: string;
  role: Role;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly USER_KEY = 'volcan_current_user';

  // State
  private readonly currentUserSignal = signal<User | null>(this.loadUserFromStorage());
  
  // Selectors
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role.code === 'admin');
  readonly isCashier = computed(() => this.currentUserSignal()?.role.code === 'cashier');

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.tokenService.setToken(response.accessToken);
        this.setCurrentUser(response.user);
      })
    );
  }

  logout(): void {
    this.tokenService.removeToken();
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private loadUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    console.log('AuthService: loadUserFromStorage', userStr);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('AuthService: parsed user', user);
        return user;
      } catch (e) {
        console.error('AuthService: error parsing user', e);
        return null;
      }
    }
    return null;
  }
}
