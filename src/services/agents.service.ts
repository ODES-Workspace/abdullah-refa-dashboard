import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Agent status type
export type AgentStatus = 'incomplete_profile' | 'pending' | 'approved' | 'rejected';

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
  agent_status: AgentStatus;
  role: string | null;
  created_at: string;
  updated_at: string;
  city: any | null;
  agent_profile?: {
    id: number;
    user_id: number;
    agency_name: string;
    company_registration_id: string;
    fal_license_number: string;
    fal_document: string;
    agency_address_line_1: string;
    agency_address_line_2: string;
    city: string;
    country: string;
    postal_code: string;
    account_number: string;
    bank_name: string;
    iban_number: string;
    created_at: string;
    updated_at: string;
    latest_iban_request?: IbanRequest;
  } | null;
}

// Interface for IBAN verification request
export interface IbanRequest {
  id: number;
  agent_profile_id: number;
  iban_number: string;
  is_valid: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// Interface for Agent with Profile (for detailed view)
export interface AgentWithProfile {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string;
  national_id: string | null;
  city_id: number | null;
  email_verified_at: string | null;
  active: number;
  agent_status: AgentStatus;
  role: string | null;
  created_at: string;
  updated_at: string;
  city: any | null;
  agent_profile?: {
    id: number;
    user_id: number;
    agency_name: string;
    company_registration_id: string;
    fal_license_number: string;
    fal_document: string;
    agency_address_line_1: string;
    agency_address_line_2: string;
    city: string;
    country: string;
    postal_code: string;
    account_number: string;
    bank_name: string;
    iban_number: string;
    created_at: string;
    updated_at: string;
    latest_iban_request?: IbanRequest;
  };
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

// Interface for approve agent response
export interface ApproveAgentResponse {
  message: string;
  agent: Agent;
}

// Interface for reject agent response
export interface RejectAgentResponse {
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
   * Get a specific agent by ID (admin only)
   * @param id - Agent ID
   * @returns Observable of agent with profile details
   */
  getAgentById(id: number): Observable<AgentWithProfile> {
    const url = `${this.baseUrl}/admin/agents/${id}`;
    return this.http
      .get<AgentWithProfile>(url)
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
   * Approve an agent (admin only)
   * Sets agent_status = 'approved' and active = true
   * @param id - Agent ID
   * @returns Observable of the approve response
   */
  approveAgent(id: number): Observable<ApproveAgentResponse> {
    const url = `${this.baseUrl}/admin/agents/${id}/activate`;
    return this.http
      .post<ApproveAgentResponse>(url, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Reject an agent (admin only)
   * Sets agent_status = 'rejected' and active = false
   * @param id - Agent ID
   * @returns Observable of the reject response
   */
  rejectAgent(id: number): Observable<RejectAgentResponse> {
    const url = `${this.baseUrl}/admin/agents/${id}/reject`;
    return this.http
      .post<RejectAgentResponse>(url, {})
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
