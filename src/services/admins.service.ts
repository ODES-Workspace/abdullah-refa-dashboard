import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces
export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions: number[];
  created_at?: string;
  updated_at?: string;
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

    console.error('AdminsService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
