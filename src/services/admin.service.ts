import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserRoleService } from './user-role.service';
import { environment } from '../environments/environment';

// Interfaces
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface Admin {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number?: string;
  national_id?: string;
  active: number;
  role?: string;
}

export interface AdminProfile {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string;
  national_id: string;
  city_id: number | null;
  email_verified_at: string | null;
  active: number;
  role: string;
  created_at: string;
  updated_at: string;
  city: any | null;
  admin_profile: any | null;
}

export interface UpdateAdminProfileRequest {
  address_line1?: string;
  address_line2?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  city_id?: string;
  country?: string;
  postal_code?: string;
  province?: string;
  national_id?: string;
  building?: string;
}

export interface UpdateAdminProfileResponse {
  message?: string;
  admin?: AdminProfile;
}

export interface ApplicationSettings {
  eijar_fees: number;
  agent_fees: number;
  processing_fees: number;
}

export interface UpdateSettingsRequest {
  eijar_fees?: number;
  agent_fees?: number;
  processing_fees?: number;
}

export interface UpdateSettingsResponse {
  message?: string;
  settings?: ApplicationSettings;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: Admin;
}

export interface AdminValidationError {
  message: string;
  errors: {
    [key: string]: string[];
  };
}

export interface AdminLoginError {
  error: string;
}

export interface AdminUnauthenticatedResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  loginAdmin(loginData: AdminLoginRequest): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${this.baseUrl}/admin/login`, loginData)
      .pipe(
        map((response) => {
          // Store the access token in localStorage for future use
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('token_type', response.token_type);
            // Store the actual expiration timestamp (current time + expires_in seconds)
            const expirationTime = Date.now() + response.expires_in * 1000;
            localStorage.setItem('token_expires_in', expirationTime.toString());
          }

          // Ensure role is set to admin for subsequent API calls
          if (response.user) {
            this.userRoleService.setUserData(response.user);
          } else {
            this.userRoleService.setUserRole('admin');
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get admin profile
   * @returns Observable of the admin profile
   */
  getAdminProfile(): Observable<AdminProfile> {
    const url = `${this.baseUrl}/admin/me`;

    return this.http
      .get<AdminProfile>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Create or update admin profile
   * @param profileData - The admin profile data to update
   * @returns Observable of the update response
   */
  updateAdminProfile(
    profileData: UpdateAdminProfileRequest
  ): Observable<UpdateAdminProfileResponse> {
    const url = `${this.baseUrl}/admin/me`;

    return this.http
      .post<UpdateAdminProfileResponse>(url, profileData)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Get all application settings
   * @returns Observable of the application settings
   */
  getApplicationSettings(): Observable<ApplicationSettings> {
    const url = `${this.baseUrl}/admin/settings`;

    return this.http
      .get<ApplicationSettings>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Update application settings
   * @param settingsData - The settings data to update
   * @returns Observable of the update response
   */
  updateApplicationSettings(
    settingsData: UpdateSettingsRequest
  ): Observable<UpdateSettingsResponse> {
    const url = `${this.baseUrl}/admin/settings`;

    return this.http
      .put<UpdateSettingsResponse>(url, settingsData)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 422) {
        const validationError = error.error as AdminValidationError;
        errorMessage = this.formatValidationErrors(validationError);
      } else if (error.status === 401) {
        const loginError = error.error as AdminLoginError;
        const unauthenticatedResponse =
          error.error as AdminUnauthenticatedResponse;

        if (loginError?.error?.toLowerCase().includes('invalid credentials')) {
          errorMessage = 'ERRORS.INCORRECT_EMAIL_OR_PASSWORD';
        } else if (
          unauthenticatedResponse?.message
            ?.toLowerCase()
            .includes('unauthenticated')
        ) {
          errorMessage = 'ERRORS.SESSION_EXPIRED';
        } else {
          errorMessage =
            loginError?.error || 'ERRORS.INVALID_EMAIL_OR_PASSWORD';
        }
      } else if (error.status === 403) {
        const loginError = error.error as AdminLoginError;
        errorMessage = loginError?.error || 'ERRORS.ACCOUNT_NOT_ACTIVE';
      } else if (error.status === 409) {
        errorMessage = 'ERRORS.EMAIL_OR_PHONE_EXISTS';
      } else if (error.status === 500) {
        errorMessage = 'ERRORS.SERVER_ERROR';
      } else {
        errorMessage = 'ERRORS.GENERIC_ERROR';
      }
    }

    console.error('Admin service error:', error);
    return throwError(() => new Error(errorMessage));
  };

  private formatValidationErrors(
    validationError: AdminValidationError
  ): string {
    const errors: string[] = [];

    if (validationError.errors) {
      Object.keys(validationError.errors).forEach((field) => {
        const fieldErrors = validationError.errors[field];
        fieldErrors.forEach((error) => {
          const friendlyMessage = this.getFriendlyErrorMessage(field, error);
          errors.push(friendlyMessage);
        });
      });
    }

    return errors.length > 0
      ? errors.map((error) => `• ${error}`).join('<br>')
      : 'ERRORS.GENERIC_ERROR';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      name: 'Name',
      phone_number: 'Phone Number',
    };
    return labels[field] || field;
  }

  private getFriendlyErrorMessage(field: string, error: string): string {
    if (error.includes('already been taken')) {
      if (field === 'email') {
        return 'ERRORS.EMAIL_ALREADY_REGISTERED';
      }
      if (field === 'phone_number') {
        return 'ERRORS.PHONE_ALREADY_REGISTERED';
      }
      return 'ERRORS.FIELD_ALREADY_IN_USE';
    }
    if (error.includes('required')) {
      return 'ERRORS.FIELD_REQUIRED';
    }
    if (error.includes('email')) {
      return 'ERRORS.INVALID_EMAIL_FORMAT';
    }
    if (error.includes('min')) {
      return 'ERRORS.FIELD_TOO_SHORT';
    }
    if (error.includes('max')) {
      return 'ERRORS.FIELD_TOO_LONG';
    }
    if (error.includes('numeric')) {
      return 'ERRORS.FIELD_MUST_BE_NUMERIC';
    }
    if (error.includes('confirmed')) {
      return 'ERRORS.PASSWORDS_DO_NOT_MATCH';
    }
    return 'ERRORS.GENERIC_ERROR';
  }

  /**
   * Get the current access token
   * @returns The access token or null if not available
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if the user is authenticated
   * @returns True if user has a valid token
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const expiresIn = localStorage.getItem('token_expires_in');
    if (expiresIn) {
      const expirationTime = parseInt(expiresIn);
      const currentTime = Date.now();
      if (currentTime > expirationTime) {
        this.clearAuthData();
        return false;
      }
    }

    return true;
  }

  /**
   * Clear authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('token_expires_in');
  }
}
