import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const operatorGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
  if (auth.user()?.rol === 'ADMIN' || auth.user()?.rol === 'OPERADOR') return true;
  return auth.loadUser().pipe(
    map(user => user.rol === 'ADMIN' || user.rol === 'OPERADOR' ? true : router.createUrlTree(['/'])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
