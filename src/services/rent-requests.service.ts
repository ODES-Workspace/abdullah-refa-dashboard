import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private propertiesData: any[] = [];

  constructor(private http: HttpClient) {}

  loadProperties(): Observable<any[]> {
    if (this.propertiesData.length > 0) {
      return of(this.propertiesData);
    }
    return this.http.get<any[]>('assets/data/rent-requests.json').pipe(
      tap((data) => (this.propertiesData = data)),
      catchError((error) => {
        console.error('Error loading properties:', error);
        return of([]);
      })
    );
  }

  getProperties(): Observable<any[]> {
    return this.loadProperties();
  }

  getPropertyById(id: number): Observable<any | undefined> {
    return this.loadProperties().pipe(
      map((properties) => properties.find((p) => p.id === id))
    );
  }
}
