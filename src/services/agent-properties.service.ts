import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PropertiesResponse {
  data: any[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AgentPropertiesService {
  private apiUrl = 'https://dev.refa.sa/api/agent/properties';

  constructor(private http: HttpClient) {}

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

    return this.http.get<PropertiesResponse>(this.apiUrl, { headers, params });
  }

  deleteAgentProperty(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
