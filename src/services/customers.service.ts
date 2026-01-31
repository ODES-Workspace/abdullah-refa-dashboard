import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Customer {
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

export interface CustomersResponse {
  current_page: number;
  data: Customer[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get list of customers (admin only)
   * @param page - Page number
   * @param perPage - Items per page
   * @returns Observable of customers response
   */
  getCustomers(page: number = 1, perPage: number = 10): Observable<CustomersResponse> {
    const url = `${this.baseUrl}/admin/customers`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http
      .get<CustomersResponse>(url, { params })
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Get a specific customer by ID (admin only)
   * @param id - Customer ID
   * @returns Observable of customer
   */
  getCustomerById(id: number): Observable<Customer> {
    const url = `${this.baseUrl}/admin/customers/${id}`;
    return this.http
      .get<Customer>(url)
      .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Customers service error:', error);
    return throwError(() => error);
  };
}
