import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interface for Agent entity
export interface Agent {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string;
  national_id: string | null;
  city_id: number | null;
  email_verified_at: string | null;
  active: number;
  role: string | null;
  created_at: string;
  updated_at: string;
  city: any | null;
}

@Injectable({
  providedIn: 'root',
})
export class AgentsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all agents (admin only)
   * @returns Observable of agents array
   */
  getAgents(): Observable<Agent[]> {
    const url = `${this.baseUrl}/admin/agents`;
    return this.http
      .get<Agent[]>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    // Return the original HttpErrorResponse so callers can inspect
    // status codes and backend-provided error details
    console.error('Agents service error:', error);
    return throwError(() => error);
  };
}
