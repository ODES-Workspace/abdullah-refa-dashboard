import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { UserRoleService } from './user-role.service';

export interface PropertyCategory {
  id: number;
  name_en: string;
  name_ar: string;
  name?: string;
  description?: string;
  slug: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyCategoriesResponse {
  data: PropertyCategory[];
}

@Injectable({
  providedIn: 'root',
})
export class PropertyCategoriesService {
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private userRoleService: UserRoleService
  ) {}

  /**
   * Get all active property categories
   * @returns Observable of PropertyCategoriesResponse containing all active property categories
   */
  getPropertyCategories(): Observable<PropertyCategoriesResponse> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http.get<PropertyCategoriesResponse>(
      `${this.baseUrl}/${roleSegment}/categories`
    );
  }

  /**
   * Get property category by ID
   * @param id - The ID of the category to retrieve
   * @returns Observable of PropertyCategory
   */
  getPropertyCategoryById(
    id: number
  ): Observable<PropertyCategory | undefined> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<PropertyCategoriesResponse>(
        `${this.baseUrl}/${roleSegment}/categories`
      )
      .pipe(
        map((response) => response.data.find((category) => category.id === id))
      );
  }

  /**
   * Get property category by slug
   * @param slug - The slug of the category to retrieve
   * @returns Observable of PropertyCategory
   */
  getPropertyCategoryBySlug(
    slug: string
  ): Observable<PropertyCategory | undefined> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<PropertyCategoriesResponse>(
        `${this.baseUrl}/${roleSegment}/categories`
      )
      .pipe(
        map((response) =>
          response.data.find(
            (category) => category.slug.toLowerCase() === slug.toLowerCase()
          )
        )
      );
  }

  /**
   * Get property categories by language
   * @param language - 'en' for English, 'ar' for Arabic
   * @returns Observable of PropertyCategory array with localized names
   */
  getPropertyCategoriesByLanguage(
    language: 'en' | 'ar'
  ): Observable<PropertyCategory[]> {
    const roleSegment = this.userRoleService.isAdmin() ? 'admin' : 'agent';
    return this.http
      .get<PropertyCategoriesResponse>(
        `${this.baseUrl}/${roleSegment}/categories`
      )
      .pipe(
        map((response) =>
          response.data.map((category) => ({
            ...category,
            name: language === 'en' ? category.name_en : category.name_ar,
          }))
        )
      );
  }
}
