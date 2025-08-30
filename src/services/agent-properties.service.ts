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
    return `${this.baseUrl}/${roleSegment}/properties`;
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

  deleteAgentProperty(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.delete<any>(`${this.getApiUrl()}/${id}`, { headers });
  }
}
