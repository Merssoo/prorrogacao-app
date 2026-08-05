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
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/logout',
];

const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente em instantes.';

function isPublicAuthUrl(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isNetworkError(error: HttpErrorResponse): boolean {
  return error.status === 0;
}

function withFriendlyNetworkMessage(error: HttpErrorResponse): HttpErrorResponse {
  if (!isNetworkError(error)) return error;
  return new HttpErrorResponse({
    error: { message: NETWORK_ERROR_MESSAGE },
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  if (isPublicAuthUrl(req.url)) {
    return next(req).pipe(catchError((error: HttpErrorResponse) => throwError(() => withFriendlyNetworkMessage(error))));
  }

  return from(authService.getValidAccessToken()).pipe(
    switchMap((token) => next(token ? addToken(req, token) : req)),
    catchError((error: HttpErrorResponse) => {
      if (isNetworkError(error)) {
        return throwError(() => withFriendlyNetworkMessage(error));
      }
      if (error.status !== 401) {
        return throwError(() => error);
      }
      return from(authService.forceRefreshAccessToken()).pipe(
        switchMap((token) => (token ? next(addToken(req, token)) : throwError(() => error))),
      );
    }),
  );
};
