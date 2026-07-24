import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { UserRoleService } from './user-role.service';

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
  monthly_installment?: number;
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
  // Appended by the API on contract responses
  payment_schedule?: PaymentScheduleItem[];
  next_installment_date?: string;
  is_down_payment_made?: boolean;
}

// One row of the contract's payment schedule as returned by the API
// (computed server-side; carries the real paid state and due date).
export interface PaymentScheduleItem {
  installment_number: number;
  type: 'down_payment' | 'installment' | string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  transaction_id: number | null;
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

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  /**
   * Get list of contracts for the authenticated customer (agent)
   * @param page - Page number
   * @param perPage - Page size (optional; backend default is 10)
   */
  getContracts(
    page: number = 1,
    perPage?: number,
    status: string = ''
  ): Observable<ContractsResponse> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    const url = `${this.baseUrl}/${roleSegment}/contracts`;
    let params = new HttpParams();
    if (page) {
      params = params.set('page', page.toString());
    }
    if (perPage) {
      params = params.set('per_page', perPage.toString());
    }
    // Always include status param with default empty string
    params = params.set('status', status);
    return this.http
      .get<ContractsResponse>(url, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Find the contract belonging to a given rent request. The API has no
   * "contract by rent request" route, but the contracts list embeds
   * `rent_request_id` and the appended `payment_schedule`, so we fetch a large
   * page and match locally. Resolves to null when no contract exists yet
   * (e.g. the rent request has not been approved).
   */
  getContractByRentRequestId(
    rentRequestId: number
  ): Observable<Contract | null> {
    return this.getContracts(1, 1000).pipe(
      map(
        (res) =>
          res.data?.find((c) => c.rent_request_id === rentRequestId) ?? null
      )
    );
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
