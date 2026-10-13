import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize, timeout } from 'rxjs';
import { API_URL } from './api.config';
import { RequestStatus } from './request-status';

export const requestStatusInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${API_URL}/`)) return next(request);
  const status = inject(RequestStatus);
  return defer(() => {
    status.begin();
    return next(request).pipe(timeout(210000), finalize(() => status.end()));
  });
};
