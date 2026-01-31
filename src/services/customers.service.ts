import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface CustomerCity {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string | null;
  updated_at: string | null;
}

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
  agent_status: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  city: CustomerCity | null;
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get list of customers (admin only)
   * @returns Observable of customers array
   */
  getCustomers(): Observable<Customer[]> {
    const url = `${this.baseUrl}/admin/customers`;
    return this.http
      .get<Customer[]>(url)
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
