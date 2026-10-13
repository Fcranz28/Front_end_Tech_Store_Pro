import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_URL } from './api.config';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token || !request.url.startsWith(`${API_URL}/`) || [`${API_URL}/auth/login`, `${API_URL}/auth/register`].includes(request.url)) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(catchError(error => {
    if (error instanceof HttpErrorResponse && error.status === 401 && auth.token() === token && request.url !== `${API_URL}/carrito/invitado/transferir`) auth.expireSession();
    return throwError(() => error);
  }));
};
