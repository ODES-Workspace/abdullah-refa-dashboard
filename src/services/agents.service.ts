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

// Interface for updating an agent
export interface UpdateAgentPayload {
  name?: string;
  email?: string;
  phone_number?: string;
  national_id?: string;
  active?: boolean;
}

// Interface for update agent response
export interface UpdateAgentResponse {
  message: string;
  agent: Agent;
}

// Interface for delete agent response
export interface DeleteAgentResponse {
  message: string;
  agent: Agent;
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
   * Update an agent (admin only)
   * @param id - Agent ID
   * @param payload - Update payload with agent data
   * @returns Observable of the update response
   */
  updateAgent(
    id: number,
    payload: UpdateAgentPayload
  ): Observable<UpdateAgentResponse> {
    const url = `${this.baseUrl}/admin/agents/${id}`;
    return this.http
      .put<UpdateAgentResponse>(url, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Delete (deactivate) an agent (admin only)
   * @param id - Agent ID
   * @returns Observable of the delete response
   */
  deleteAgent(id: number): Observable<DeleteAgentResponse> {
    const url = `${this.baseUrl}/admin/agents/${id}`;
    return this.http
      .delete<DeleteAgentResponse>(url)
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
