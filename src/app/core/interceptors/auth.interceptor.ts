import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(addToken(req, auth.getToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.getRefreshToken()) {
        return auth.refreshToken().pipe(
          switchMap(res => next(addToken(req, res.access_token))),
          catchError(refreshErr => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      if (err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}
