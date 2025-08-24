import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgentPropertiesService {
  deleteAgentProperty(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
  private apiUrl = 'https://dev.refa.sa/api/agent/properties';

  constructor(private http: HttpClient) {}

  getAgentProperties(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl, { headers });
  }
}
