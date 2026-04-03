import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, TokenRefresh, JwtPayload } from '../models/auth.model';
import { Permission } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly PERMISSIONS_KEY = 'permissions';

  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());
  isLoggedIn$ = this.loggedIn$.asObservable();

  login(credentials: LoginRequest): Observable<TokenResponse> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  refreshToken(): Observable<TokenResponse> {
    const body: TokenRefresh = { refresh_token: this.getRefreshToken() ?? '' };
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, body).pipe(
      tap(res => this.storeSession(res))
    );
  }

  getPermissions(): Permission[] {
    try {
      return JSON.parse(localStorage.getItem(this.PERMISSIONS_KEY) ?? '[]') as Permission[];
    } catch {
      return [];
    }
  }

  getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }

  hasValidToken(): boolean {
    const payload = this.getPayload();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  getCurrentUsername(): string {
    return this.getPayload()?.sub ?? '';
  }

  private storeSession(res: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(res.permissions ?? []));
    this.loggedIn$.next(true);
  }
}
