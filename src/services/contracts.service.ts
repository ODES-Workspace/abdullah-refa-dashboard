import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface ContractProperty {
  id: number;
  name_en: string;
  name_ar: string;
  property_category_id: number;
  property_type_id: number;
  annual_rent: number;
  deposit_amount: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
}

export interface ContractRentRequest {
  id: number;
  property_id: number;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  property: ContractProperty;
}

export interface Contract {
  id: number;
  rent_request_id: number;
  contract_number: string;
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | string;
  created_at: string;
  updated_at: string;
  rent_request: ContractRentRequest;
}

export interface ContractsResponse {
  current_page: number;
  data: Contract[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ContractsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get list of contracts for the authenticated customer (agent)
   * @param page - Page number
   * @param perPage - Page size (optional; backend default is 10)
   */
  getContracts(
    page: number = 1,
    perPage?: number
  ): Observable<ContractsResponse> {
    const url = `${this.baseUrl}/agent/contracts`;
    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    if (perPage) {
      params = params.set('per_page', perPage.toString());
    }
    return this.http
      .get<ContractsResponse>(url, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request - Invalid parameters';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please check your authentication';
          break;
        case 403:
          errorMessage = 'Forbidden - You do not have permission';
          break;
        case 404:
          errorMessage = 'Not Found';
          break;
        case 422:
          errorMessage = 'Validation Error';
          break;
        case 500:
          errorMessage = 'Internal Server Error';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.statusText}`;
          break;
      }
    }
    console.error('Contracts service error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
