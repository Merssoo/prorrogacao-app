import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const PUBLIC_AUTH_PATHS = [
  '/auth/register',
  '/auth/verify-email',
  '/auth/login',
  '/auth/resend-code',
  '/auth/refresh-token',
];

function isPublicAuthUrl(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.apiUrl) || isPublicAuthUrl(req.url)) {
    return next(req);
  }

  return from(authService.getValidAccessToken()).pipe(
    switchMap((token) => next(token ? addToken(req, token) : req)),
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }
      return from(authService.forceRefreshAccessToken()).pipe(
        switchMap((token) => (token ? next(addToken(req, token)) : throwError(() => error))),
      );
    }),
  );
};
