import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { StoreApi } from './store-api';
import { API_URL } from './api.config';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'USER' | 'OPERADOR' | 'ADMIN';
}

interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cartApi = inject(StoreApi);
  private readonly api = `${API_URL}/auth`;
  readonly user = signal<User | null>(null);
  readonly token = signal<string | null>(sessionStorage.getItem('techstore_token'));
  readonly sessionExpired = signal(false);

  register(nombre: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/register`, { nombre, email, password })
      .pipe(tap(response => this.save(response)), switchMap(response => response.user.rol === 'OPERADOR' ? of(response) : this.cartApi.restoreAfterLogin().pipe(
        map(() => response), catchError(() => { this.cartApi.transferError.set('No pudimos recuperar tu carrito. Inténtalo desde el carrito.'); return of(response); })
      )));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(tap(response => this.save(response)), switchMap(response => response.user.rol === 'OPERADOR' ? of(response) : this.cartApi.restoreAfterLogin().pipe(
        map(() => response), catchError(() => { this.cartApi.transferError.set('No pudimos recuperar tu carrito. Inténtalo desde el carrito.'); return of(response); })
      )));
  }

  loadUser() {
    return this.http.get<User>(`${this.api}/me`).pipe(tap(user => this.user.set(user)));
  }

  expireSession() {
    sessionStorage.removeItem('techstore_token');
    this.token.set(null); this.user.set(null); this.sessionExpired.set(true);
    this.cartApi.cart.set({ items: [], total: 0 });
  }

  logout() {
    sessionStorage.removeItem('techstore_token');
    this.token.set(null);
    this.user.set(null);
    this.cartApi.cart.set({ items: [], total: 0 });
    this.cartApi.sidebarOpen.set(false);
    this.cartApi.transferError.set('');
    this.cartApi.loadCart().subscribe({ error: () => {} });
  }

  private save(response: AuthResponse) { this.sessionExpired.set(false);
    sessionStorage.setItem('techstore_token', response.token);
    this.token.set(response.token);
    this.user.set(response.user);
  }
}
