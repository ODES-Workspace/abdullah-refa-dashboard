import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Interfaces for the agent dashboard response
export interface AgentDashboardResponse {
  total_properties: number;
  total_rent_requests: number;
  total_accepted_rent_requests: number;
  total_rejected_rent_requests: number;
  total_contract_amounts: number;
  rent_requests: RentRequest[];
}

// Interfaces for the admin dashboard response
export interface AdminDashboardResponse {
  total_properties: number;
  total_tenants: number;
  total_users: number;
  total_agents: number;
  total_rent_requests: number;
  total_contracts: number;
  total_contract_amounts: string;
  total_refa_fees: number;
  rent_requests: RentRequest[];
}

export interface RentRequest {
  id: number;
  created_by: number;
  property_id: number;
  name: string;
  email: string;
  phone: string;
  city_id: number;
  date_of_birth: string;
  nationality: number;
  number_of_family_members: number;
  national_id: string;
  job_title: string;
  job_start_date: string;
  employer_name: string;
  sector: string;
  subsector: string;
  proof_of_income_document: string;
  credit_score_document: string;
  has_debts: boolean;
  debts_monthly_amount: string | null;
  debts_remaining_months: number | null;
  monthly_income: string;
  expected_monthly_cost: string;
  number_of_installments: number;
  additional_charges: AdditionalCharges;
  down_payment: string;
  status: string;
  status_description: string | null;
  created_at: string;
  updated_at: string;
  monthly_installment: number;
  property: Property;
}

export interface AdditionalCharges {
  agent_fees: number | string;
  eijar_fees: string;
  processing_fees: string;
}

export interface Property {
  id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  purpose: string;
  price: string;
  property_category_id: number;
  property_type_id: number;
  area: number;
  available_from: string;
  year_built: number | null;
  furnishing_status: string;
  is_featured: number;
  bedrooms: number;
  bathrooms: number;
  floor_number: number;
  total_floors: number;
  insurance_amount: number | null;
  fal_number: string;
  ad_number: string;
  annual_rent: number;
  deposit_amount: number;
  building_number: string;
  country: string;
  region: string;
  city: string;
  district: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  primary_image_url: string;
  category: PropertyCategory;
  type: PropertyType;
  creator: PropertyCreator;
  primary_image: PropertyImage;
}

export interface PropertyCategory {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  is_active: number;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyType {
  id: number;
  property_category_id: number;
  name_en: string;
  name_ar: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreator {
  id: number;
  type: string;
  name: string;
  email: string;
  phone_number: string;
  national_id: string;
  city_id: number | null;
  email_verified_at: string | null;
  active: number;
  role: string;
  created_at: string;
  updated_at: string;
  city: string | null;
  agent_profile: AgentProfile | null;
  admin_profile: any | null;
}

export interface AgentProfile {
  id: number;
  user_id: number;
  agency_name: string;
  company_registration_id: string;
  fal_license_number: string;
  fal_document: string;
  agency_address_line_1: string;
  agency_address_line_2: string;
  city: string;
  country: string;
  postal_code: string;
  account_number: string;
  bank_name: string;
  iban_number: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  path: string;
  is_primary: boolean;
  order: number;
  alt_text: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  /**
   * Get agent dashboard data
   * @returns Observable<AgentDashboardResponse>
   */
  getAgentDashboard(): Observable<AgentDashboardResponse> {
    return this.http.get<AgentDashboardResponse>(
      `${environment.baseUrl}/agent/dashboard`
    );
  }

  /**
   * Get admin dashboard data
   * @returns Observable<AdminDashboardResponse>
   */
  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(
      `${environment.baseUrl}/admin/dashboard`
    );
  }
}
