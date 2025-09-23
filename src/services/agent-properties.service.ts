import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { UserRoleService } from './user-role.service';
import { Router } from '@angular/router';

export interface PropertiesResponse {
  data: any[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AgentPropertiesService {
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService,
    private router: Router
  ) {}

  private getApiUrl(): string {
    const routeSegment = this.router.url.includes('/admin') ? 'admin' : null;
    const roleSegment = routeSegment
      ? routeSegment
      : this.userRoleService.isAdmin()
      ? 'admin'
      : 'agent';
    const url = `${this.baseUrl}/${roleSegment}/properties`;
    console.log('API URL for properties:', url, 'Current route:', this.router.url, 'Role:', roleSegment);
    return url;
  }

  getAgentProperties(
    token: string,
    search?: string,
    page: number = 1,
    perPage: number = 10
  ): Observable<PropertiesResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PropertiesResponse>(this.getApiUrl(), {
      headers,
      params,
    });
  }

  getAgentPropertiesWithFilters(
    token: string,
    filterParams: {
      search?: string;
      page?: number;
      per_page?: number;
      category_id?: string;
      type_id?: string;
      min_price?: string;
      max_price?: string;
      bedrooms?: string;
      bathrooms?: string;
      sort_by?: string;
    }
  ): Observable<PropertiesResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    let params = new HttpParams()
      .set('page', (filterParams.page || 1).toString())
      .set('per_page', (filterParams.per_page || 10).toString());

    // Add filters to params if they exist
    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key as keyof typeof filterParams];
      if (value && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PropertiesResponse>(this.getApiUrl(), {
      headers,
      params,
    });
  }

  deleteAgentProperty(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.delete<any>(`${this.getApiUrl()}/${id}`, { headers });
  }
}
