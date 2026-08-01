import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable, firstValueFrom, from, map, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { SecureStorageService } from './secure-storage.service';
import { environment } from '../../environments/environment';

export interface JwtPayload {
  sub: string;
  name?: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  profileCreated: boolean;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_EXPIRY_BUFFER_SECONDS = 300;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authEndpoint = '/auth';

  private readonly authStateSubject = new BehaviorSubject<boolean>(false);
  readonly authState$ = this.authStateSubject.asObservable();

  private readonly currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly httpNoInterceptors: HttpClient;

  private refreshInFlight: Promise<RefreshResponse> | null = null;

  constructor(
    private readonly apiService: ApiService,
    private readonly storage: SecureStorageService,
    private readonly router: Router,
    httpBackend: HttpBackend,
  ) {
    this.httpNoInterceptors = new HttpClient(httpBackend);
  }

  async initialize(): Promise<void> {
    const accessToken = await this.storage.getAccessToken();
    if (accessToken && !this.isTokenExpired(accessToken)) {
      this.applySession(accessToken);
      return;
    }
    try {
      await this.refreshSession();
    } catch {
      this.authStateSubject.next(false);
    }
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState$;
  }

  isTokenExpired(token: string): boolean {
    const decoded = this.decode(token);
    if (!decoded?.exp) return !decoded;
    return Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_BUFFER_SECONDS >= decoded.exp;
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>(`${this.authEndpoint}/login`, credentials).pipe(
      switchMap((response) =>
        from(this.persistSession(response.accessToken, response.refreshToken)).pipe(map(() => response)),
      ),
    );
  }

  register(data: { name: string; email: string; password: string }): Observable<{ message?: string }> {
    return this.apiService.post(`${this.authEndpoint}/register`, data);
  }

  verifyEmail(data: { email: string; code: string }): Observable<{ message?: string }> {
    return this.apiService.post(`${this.authEndpoint}/verify-email`, data);
  }

  resendCode(data: { email: string }): Observable<{ message?: string }> {
    return this.apiService.post(`${this.authEndpoint}/resend-code`, data);
  }

  async getValidAccessToken(): Promise<string | null> {
    const accessToken = await this.storage.getAccessToken();
    if (accessToken && !this.isTokenExpired(accessToken)) {
      return accessToken;
    }
    try {
      const { accessToken: refreshed } = await this.refreshSession();
      return refreshed;
    } catch {
      return null;
    }
  }

  async forceRefreshAccessToken(): Promise<string | null> {
    try {
      const { accessToken } = await this.refreshSession();
      return accessToken;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.storage.clear();
    this.authStateSubject.next(false);
    this.currentUserSubject.next(null);
    await this.router.navigate(['/login']);
  }

  private refreshSession(): Promise<RefreshResponse> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private async performRefresh(): Promise<RefreshResponse> {
    const refreshToken = await this.storage.getRefreshToken();
    if (!refreshToken) {
      await this.logout();
      throw new Error('No refresh token available');
    }

    try {
      const response = await firstValueFrom(
        this.httpNoInterceptors.post<RefreshResponse>(`${environment.apiUrl}${this.authEndpoint}/refresh-token`, {
          refreshToken,
        }),
      );
      await this.persistSession(response.accessToken, response.refreshToken);
      return response;
    } catch (error) {
      if (this.isRefreshTokenRejected(error)) {
        await this.logout();
      }
      throw error;
    }
  }

  private isRefreshTokenRejected(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private async persistSession(accessToken: string, refreshToken: string): Promise<void> {
    await this.storage.setAccessToken(accessToken);
    await this.storage.setRefreshToken(refreshToken);
    this.applySession(accessToken);
  }

  private applySession(accessToken: string): void {
    const decoded = this.decode(accessToken);
    this.authStateSubject.next(true);
    this.currentUserSubject.next(
      decoded ? { id: decoded.sub, name: decoded.name ?? '', email: decoded.email ?? '' } : null,
    );
  }

  private decode(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
