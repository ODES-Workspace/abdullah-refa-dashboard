import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface CreatePropertyRequest {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  property_category_id: number;
  property_type_id: number;
  area: number;
  available_from: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  floor_number: number;
  total_floors: number;
  insurance_amount: number;
  fal_number: string;
  ad_number: string;
  annual_rent: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  amenities: Array<{
    id: number;
    distance?: string;
  }>;
  images: string[]; // Array of data URLs (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
  primary_image_index: number;
}

export interface CreatePropertyResponse {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  area: number;
  available_from: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  floor_number: number;
  total_floors: number;
  insurance_amount: number;
  fal_number: string;
  ad_number: string;
  annual_rent: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  primary_image_url: string;
  created_at: string;
  updated_at: string;
  updated_by: {
    id: number;
    name: string;
    email: string;
  };
  category: {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
    created_at: string;
    updated_at: string;
  };
  type: {
    name_en: string;
    name_ar: string;
    name: string;
    slug: string;
    property_category_id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category: {
      id: number;
      name_en: string;
      name_ar: string;
      name: string;
      slug: string;
    };
  };
  images: Array<{
    id: number;
    property_id: number;
    url: string;
    thumbnail_url: string;
    is_primary: boolean;
    order: number;
    alt_text: string;
    created_at: string;
    updated_at: string;
  }>;
  amenities: Array<{
    id: number;
    name_en: string;
    name_ar: string;
    icon: string;
    distance: string;
    created_at: string;
    updated_at: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private baseUrl = environment.baseUrl;
  private propertiesData: any[] = [];

  constructor(private http: HttpClient) {}

  /**
   * Create a new property
   * @param propertyData - The property data to create
   * @returns Observable of CreatePropertyResponse
   */
  createProperty(
    propertyData: CreatePropertyRequest
  ): Observable<CreatePropertyResponse> {
    return this.http.post<CreatePropertyResponse>(
      `${this.baseUrl}/agent/properties`,
      propertyData
    );
  }

  // Load properties from JSON file
  loadProperties(): Observable<any[]> {
    if (this.propertiesData.length > 0) {
      return of(this.propertiesData);
    }
    return this.http.get<any[]>('assets/data/properties.json').pipe(
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

  updateProperty(id: number, property: any): Observable<boolean> {
    const index = this.propertiesData.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.propertiesData[index] = {
        ...this.propertiesData[index],
        ...property,
      };
      return of(true);
    }
    return of(false);
  }

  deleteProperty(id: number): Observable<boolean> {
    const index = this.propertiesData.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.propertiesData.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
