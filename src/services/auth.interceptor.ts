import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip authentication for login endpoints
  if (req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  const handle401 = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('token_expires_in');

    window.location.href = '/login';
  };

  // Check token expiration before making any request
  const checkTokenExpiration = () => {
    const expiresIn = localStorage.getItem('token_expires_in');
    if (expiresIn) {
      const expirationTime = parseInt(expiresIn);
      const currentTime = Date.now();
      if (currentTime > expirationTime) {
        handle401();
        return true; // Token is expired
      }
    }
    return false; // Token is valid
  };

  // Check if token is expired
  if (checkTokenExpiration()) {
    return next(req); // This will be redirected by handle401
  }

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq).pipe(
      catchError((error) => {
        if (error.status === 401) {
          handle401();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        handle401();
      }
      return throwError(() => error);
    })
  );
};
