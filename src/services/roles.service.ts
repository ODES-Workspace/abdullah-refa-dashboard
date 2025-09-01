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

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
  permissions: number[];
}

export interface CreateAdminResponse {
  message: string;
  data?: any;
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
   * Create a new admin
   * POST /api/admin/admins
   */
  createAdmin(adminData: CreateAdminRequest): Observable<CreateAdminResponse> {
    const url = `${this.baseUrl}/admin/admins`;

    return this.http
      .post<CreateAdminResponse>(url, adminData)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    // For 422 validation errors, preserve the original error structure
    if (error.status === 422) {
      console.error('RolesService 422 validation error:', error);
      return throwError(() => error); // Return the original HttpErrorResponse
    }

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
