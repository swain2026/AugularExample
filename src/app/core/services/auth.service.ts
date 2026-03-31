import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, TokenResponse, TokenRefresh, JwtPayload } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());

  isLoggedIn$ = this.loggedIn$.asObservable();

  login(credentials: LoginRequest): Observable<TokenResponse> {
    // FastAPI OAuth2 expects form data
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
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
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refresh_token);
      })
    );
  }

  getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as JwtPayload;
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
}
