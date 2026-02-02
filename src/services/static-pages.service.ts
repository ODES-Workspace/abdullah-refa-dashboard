import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface StaticPage {
  id: number;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedStaticPagesResponse {
  current_page: number;
  data: StaticPage[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface CreateStaticPageRequest {
  title: string;
  content: string;
  slug: string;
}

export interface UpdateStaticPageRequest {
  title?: string;
  content?: string;
  slug?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StaticPagesService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all static pages (public)
   */
  getStaticPages(): Observable<StaticPage[]> {
    return this.http
      .get<PaginatedStaticPagesResponse>(`${this.baseUrl.replace('/api', '')}/api/static-pages`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Get a static page by slug (public)
   */
  getStaticPageBySlug(slug: string): Observable<StaticPage> {
    return this.http
      .get<StaticPage>(`${this.baseUrl.replace('/api', '')}/api/static-pages/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new static page (admin only)
   */
  createStaticPage(data: CreateStaticPageRequest): Observable<StaticPage> {
    return this.http
      .post<StaticPage>(`${this.baseUrl}/admin/static-pages`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update a static page (admin only)
   */
  updateStaticPage(id: number, data: UpdateStaticPageRequest): Observable<StaticPage> {
    return this.http
      .put<StaticPage>(`${this.baseUrl}/admin/static-pages/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('StaticPagesService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
