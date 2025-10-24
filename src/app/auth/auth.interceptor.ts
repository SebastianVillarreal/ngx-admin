import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');

    // No adjuntar token al endpoint de login
    const isSignIn = req.url.includes('/api/SignIn');

    let authReq = req;
    if (token && !isSignIn) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          // Opcional: limpiar y redirigir al login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          this.router.navigateByUrl('/auth/login');
        }
        return throwError(() => err);
      }),
    );
  }
}
