import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

// Interfaces for type safety
export interface Property {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  purpose: string;
  price: string;
  property_category_id: number;
  property_type_id: number;
  area: number;
  available_from: string;
  year_built: number | null;
  furnishing_status: string;
  is_featured: number;
  bedrooms: number;
  bathrooms: number;
  floor_number: number;
  total_floors: number;
  insurance_amount: number;
  fal_number: string;
  ad_number: string;
  annual_rent: number;
  deposit_amount: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Tenant {
  id: number;
  name: string;
  property_id: number;
  city_id: number;
  phone: string;
  email: string;
  created_at: string;
  monthly_installment: number;
  property: Property;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface TenantsResponse {
  current_page: number;
  data: Tenant[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface UpdateTenantPayload {
  name?: string;
  email?: string;
  phone?: string;
  city_id?: number;
}

export interface UpdateTenantResponse {
  message: string;
  tenant: Tenant;
}

@Injectable({
  providedIn: 'root',
})
export class TenantsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * List all tenants for admin
   * @param page - Page number for pagination (default: 1)
   * @param perPage - Page size (optional; backend default is 10)
   * @returns Observable of the tenants response with pagination
   */
  getTenants(page: number = 1, perPage?: number): Observable<TenantsResponse> {
    const url = `${this.baseUrl}/admin/tenants`;

    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    if (perPage) {
      params = params.set('per_page', perPage.toString());
    }

    return this.http
      .get<TenantsResponse>(url, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Update tenant information
   * @param id - Tenant ID
   * @param payload - Updated tenant data
   * @returns Observable of the update response
   */
  updateTenant(
    id: number,
    payload: UpdateTenantPayload
  ): Observable<UpdateTenantResponse> {
    const url = `${this.baseUrl}/admin/tenants/${id}`;

    return this.http
      .put<UpdateTenantResponse>(url, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    // Always return the original HttpErrorResponse so callers can inspect
    // status codes and backend-provided validation payloads (e.g. 422 errors).
    console.error('Tenants service error:', error);
    return throwError(() => error);
  };
}
