import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces
export interface AdminPermission {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  pivot: {
    user_id: number;
    permission_id: number;
    created_at: string;
    updated_at: string;
  };
}

export interface Admin {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number?: string;
  national_id?: string;
  city_id?: number;
  email_verified_at?: string;
  active: number; // API returns 1/0, not boolean
  role: string;
  created_at: string;
  updated_at: string;
  city?: {
    id: number;
    name_en: string;
    name_ar: string;
    created_at: string | null;
    updated_at: string | null;
  };
  permissions: AdminPermission[];
}

export interface UpdateAdminRequest {
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions: number[];
  // Alternative format if API expects different structure
  // permissions?: { [key: string]: number };
}

export interface UpdateAdminResponse {
  message: string;
  data: Admin;
}

export interface DeleteAdminResponse {
  message: string;
  success: boolean;
}

export interface AdminsResponse {
  data: Admin[];
  message?: string;
  // Pagination fields if the API supports them
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all admins
   * GET /api/admin/admins
   */
  getAdmins(params?: URLSearchParams): Observable<AdminsResponse> {
    let url = `${this.baseUrl}/admin/admins`;

    if (params) {
      url += `?${params.toString()}`;
    }

    return this.http
      .get<AdminsResponse>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Update an admin
   * PUT /api/admin/admins/{id}
   */
  updateAdmin(
    id: number,
    payload: UpdateAdminRequest
  ): Observable<UpdateAdminResponse> {
    const url = `${this.baseUrl}/admin/admins/${id}`;
    return this.http
      .put<UpdateAdminResponse>(url, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Delete (deactivate) an admin
   * DELETE /api/admin/admins/{id}
   */
  deleteAdmin(id: number): Observable<DeleteAdminResponse> {
    const url = `${this.baseUrl}/admin/admins/${id}`;
    return this.http
      .delete<DeleteAdminResponse>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    // For 422 validation errors, preserve the original error structure
    if (error.status === 422) {
      console.error('AdminsService 422 validation error:', error);
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

    console.error('AdminsService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
