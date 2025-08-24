import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface PropertyCategory {
  id: number;
  name_en: string;
  name_ar: string;
  name: string;
  slug: string;
}

export interface PropertyType {
  id: number;
  property_category_id: number;
  name_en: string;
  name_ar: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: PropertyCategory;
}

export interface PropertyTypesResponse {
  data: PropertyType[];
}

@Injectable({
  providedIn: 'root',
})
export class PropertyTypesService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all active property types
   * @returns Observable of PropertyTypesResponse containing all active property types with their category information
   */
  getPropertyTypes(): Observable<PropertyTypesResponse> {
    return this.http.get<PropertyTypesResponse>(
      `${this.baseUrl}/agent/property-types`
    );
  }

  /**
   * Get property types by category
   * @param categorySlug - The slug of the category to filter by
   * @returns Observable of PropertyType array filtered by category
   */
  getPropertyTypesByCategory(categorySlug: string): Observable<PropertyType[]> {
    return this.http
      .get<PropertyTypesResponse>(`${this.baseUrl}/agent/property-types`)
      .pipe(
        map((response) =>
          response.data.filter((type) => type.category.slug === categorySlug)
        )
      );
  }

  /**
   * Get property types by category ID
   * @param categoryId - The ID of the category to filter by
   * @returns Observable of PropertyType array filtered by category ID
   */
  getPropertyTypesByCategoryId(categoryId: number): Observable<PropertyType[]> {
    return this.http
      .get<PropertyTypesResponse>(`${this.baseUrl}/agent/property-types`)
      .pipe(
        map((response) =>
          response.data.filter(
            (type) => type.property_category_id === categoryId
          )
        )
      );
  }
}
