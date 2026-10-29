import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth-service';

/** Un 401 cierra la sesión; un 403 conserva la sesión y llega al componente. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 401 &&
        req.url.startsWith(`${environment.apiUrl}/`) &&
        !req.url.endsWith('/auth/login')
      ) {
        auth.cerrarSesion('expirada', router.url);
      }
      return throwError(() => err);
    }),
  );
};
