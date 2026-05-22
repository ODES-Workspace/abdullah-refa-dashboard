import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PasswordEmailRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export interface PasswordResetResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private readonly baseUrl = environment.baseUrl;
  private readonly jsonHeaders = new HttpHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  requestPasswordEmail(email: string): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(
      `${this.baseUrl}/password/email`,
      { email },
      { headers: this.jsonHeaders }
    );
  }

  resetPassword(
    payload: PasswordResetRequest
  ): Observable<PasswordResetResponse> {
    return this.http.post<PasswordResetResponse>(
      `${this.baseUrl}/password/reset`,
      payload,
      { headers: this.jsonHeaders }
    );
  }
}
