import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces
export interface Permission {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionsResponse {
  data: Permission[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all permissions
   * GET /api/admin/permissions
   */
  getPermissions(): Observable<Permission[]> {
    const url = `${this.baseUrl}/admin/permissions`;

    return this.http
      .get<Permission[]>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }

    console.error('RolesService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
