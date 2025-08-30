import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';
import { UserRoleService } from './user-role.service';

export interface Amenity {
  id: number;
  name_en: string;
  name_ar: string;
  requires_distance: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AmenitiesResponse {
  data: Amenity[];
}

@Injectable({
  providedIn: 'root',
})
export class AmenitiesService {
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  /**
   * Get all active property amenities
   * @param search - Optional search term to filter amenities by name
   * @returns Observable of AmenitiesResponse containing all active amenities
   */
  getAmenities(search?: string): Observable<AmenitiesResponse> {
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }

    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http.get<AmenitiesResponse>(
      `${this.baseUrl}/${roleSegment}/amenities`,
      {
        params,
      }
    );
  }

  /**
   * Get amenities that don't require distance (property features)
   * @returns Observable of Amenity array
   */
  getPropertyAmenities(): Observable<Amenity[]> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<AmenitiesResponse>(`${this.baseUrl}/${roleSegment}/amenities`)
      .pipe(
        map((response) =>
          response.data.filter((amenity) => amenity.requires_distance === 0)
        )
      );
  }

  /**
   * Get amenities that require distance (nearby facilities)
   * @returns Observable of Amenity array
   */
  getDistanceAmenities(): Observable<Amenity[]> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<AmenitiesResponse>(`${this.baseUrl}/${roleSegment}/amenities`)
      .pipe(
        map((response) =>
          response.data.filter((amenity) => amenity.requires_distance === 1)
        )
      );
  }

  /**
   * Search amenities by name
   * @param searchTerm - Search term to filter amenities
   * @returns Observable of Amenity array
   */
  searchAmenities(searchTerm: string): Observable<Amenity[]> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<AmenitiesResponse>(`${this.baseUrl}/${roleSegment}/amenities`, {
        params: { search: searchTerm },
      })
      .pipe(map((response) => response.data));
  }
}
