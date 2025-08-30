import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { UserRoleService } from './user-role.service';

// Interfaces for type safety
export interface RentRequest {
  id: number;
  created_by: number;
  property_id: number;
  name: string;
  email: string;
  phone: string;
  city_id: number;
  date_of_birth: string;
  nationality: number;
  number_of_family_members: number;
  national_id: string;
  job_title: string;
  job_start_date: string;
  employer_name: string;
  sector: string;
  subsector: string;
  proof_of_income_document: string;
  credit_score_document: string;
  has_debts: boolean;
  debts_monthly_amount: number | null;
  debts_remaining_months: number | null;
  monthly_income: string;
  expected_monthly_cost: string;
  number_of_installments: number;
  additional_charges: {
    agent_fees: number;
    eijar_fees: string;
    processing_fees: string;
  };
  down_payment: string;
  status: 'pending' | 'approved' | 'rejected';
  status_description: string | null;
  created_at: string;
  updated_at: string;
  property: Property;
}

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

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface RentRequestsResponse {
  current_page: number;
  data: RentRequest[];
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

@Injectable({
  providedIn: 'root',
})
export class RentRequestsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  /**
   * List all rent requests for admin
   * @param page - Page number for pagination (default: 1)
   * @param perPage - Page size (optional; backend default is 10)
   * @returns Observable of the rent requests response with pagination
   */
  getRentRequests(
    page: number = 1,
    perPage?: number
  ): Observable<RentRequestsResponse> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    const url = `${this.baseUrl}/${roleSegment}/rent-requests`;

    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    if (perPage) {
      params = params.set('per_page', perPage.toString());
    }

    return this.http
      .get<RentRequestsResponse>(url, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Get a single rent request by ID
   * @param id - Rent request ID
   * @returns Observable of the rent request details
   */
  getRentRequestById(id: number): Observable<any> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    const url = `${this.baseUrl}/${roleSegment}/rent-requests/${id}`;
    return this.http
      .get<any>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Approve a rent request (admin only)
   */
  approveRentRequest(id: number): Observable<any> {
    const url = `${this.baseUrl}/admin/rent-requests/${id}/approve`;
    return this.http
      .put<any>(url, {})
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Reject a rent request (admin only)
   * @param id Rent request ID
   * @param payload Arbitrary payload, e.g. { status_description: string }
   */
  rejectRentRequest(
    id: number,
    payload: Record<string, any> = {}
  ): Observable<any> {
    const url = `${this.baseUrl}/admin/rent-requests/${id}/reject`;
    return this.http
      .put<any>(url, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request - Invalid parameters';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please check your authentication';
          break;
        case 403:
          errorMessage =
            'Forbidden - You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Not Found - The requested resource was not found';
          break;
        case 422:
          errorMessage = 'Validation Error - Please check your input data';
          break;
        case 500:
          errorMessage = 'Internal Server Error - Please try again later';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
          break;
      }
    }

    console.error('Rent Requests service error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
