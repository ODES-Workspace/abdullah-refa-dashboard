import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Agent status type
export type AgentStatus = 'incomplete_profile' | 'pending' | 'approved' | 'rejected';

export interface AgentProfileResponse {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string | null;
  national_id: string | null;
  city_id: number | null;
  email_verified_at: string | null;
  active: number | boolean;
  agent_status: AgentStatus;
  role: string | null;
  created_at: string;
  updated_at: string;
  city: {
    id: number;
    name_en: string;
    name_ar: string;
    created_at: string;
    updated_at: string;
  } | null;
  agent_profile: {
    user_id: number;
    agency_name: string | null;
    company_registration_id: string | null;
    fal_license_number: string | null;
    fal_document: string | null;
    agency_address_line_1: string | null;
    agency_address_line_2: string | null;
    city: string | null;
    country: string | null;
    postal_code: string | null;
    account_number: string | null;
    bank_name: string | null;
    iban_number: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface AgentProfileUpdate {
  agency_name?: string;
  company_registration_id?: string;
  fal_license_number?: string;
  fal_document?: File | null;
  agency_address_line_1?: string;
  agency_address_line_2?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  account_number?: string;
  bank_name?: string;
  iban_number?: string;
  email?: string;
  phone_number?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileAgentService {
  private readonly baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) {}

  /**
   * Get authenticated agent profile
   */
  getMyProfile(): Observable<AgentProfileResponse> {
    const url = `${this.baseUrl}/agent/me`;
    return this.http
      .get<AgentProfileResponse>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Create or update agent profile (multipart/form-data)
   */
  upsertMyProfile(
    payload: AgentProfileUpdate
  ): Observable<AgentProfileResponse> {
    const url = `${this.baseUrl}/agent/me`;
    const form = new FormData();

    const appendIfPresent = (key: keyof AgentProfileUpdate) => {
      const value = payload[key];
      if (value !== undefined && value !== null) {
        // FormData expects string or Blob/File
        if (value instanceof File) {
          form.append(key as string, value);
        } else {
          form.append(key as string, String(value));
        }
      }
    };

    appendIfPresent('agency_name');
    appendIfPresent('company_registration_id');
    appendIfPresent('fal_license_number');
    appendIfPresent('fal_document');
    appendIfPresent('agency_address_line_1');
    appendIfPresent('agency_address_line_2');
    appendIfPresent('city');
    appendIfPresent('country');
    appendIfPresent('postal_code');
    appendIfPresent('account_number');
    appendIfPresent('bank_name');
    appendIfPresent('iban_number');
    appendIfPresent('email');
    appendIfPresent('phone_number');

    return this.http
      .post<AgentProfileResponse>(url, form)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    // Preserve full HttpErrorResponse so callers can read payload.errors
    console.error('ProfileAgentService error:', error);
    return throwError(() => error);
  };
}
