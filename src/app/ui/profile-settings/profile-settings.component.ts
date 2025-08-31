import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  AdminService,
  AdminProfile,
  UpdateAdminProfileRequest,
  UpdateAdminProfileResponse,
} from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { CitiesService, City } from '../../../services/cities.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ToastComponent,
    KeyValuePipe,
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent implements OnInit {
  isEditing = false;
  showPasswordForm = false;
  isLoading = false;
  isSaving = false;

  profileData = {
    name: '',
    email: '',
    contact: '',
    line1: '',
    line2: '',
    building: '',
    country: '',
    province: '',
    city: '',
    postalCode: '',
    nationalId: '',
  };

  passwordData = {
    newPassword: '',
    confirmPassword: '',
  };

  // Validation error handling
  validationErrors: { [key: string]: string[] } = {};
  validationMessage = '';

  // Cities data
  cities: City[] = [];
  currentLang = 'en';

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private citiesService: CitiesService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentLang = this.translateService.currentLang || 'en';
    this.loadCities();
    this.loadAdminProfile();

    // Subscribe to language changes
    this.translateService.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
    });
  }

  /**
   * Load cities data from the API
   */
  loadCities(): void {
    this.citiesService.getCities().subscribe({
      next: (cities: City[]) => {
        this.cities = cities;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading cities:', error);
        this.toastService.show('Failed to load cities data');
      },
    });
  }

  /**
   * Get city name by ID with localization
   */
  getCityName(cityId: string | number): string {
    if (!cityId || !this.cities.length) return '';
    const city = this.cities.find((c) => c.id === Number(cityId));
    if (!city) return '';

    return this.currentLang === 'ar' ? city.name_ar : city.name_en;
  }

  /**
   * Load admin profile data from the API
   */
  loadAdminProfile(): void {
    this.isLoading = true;
    this.adminService.getAdminProfile().subscribe({
      next: (profile: AdminProfile) => {
        this.mapProfileToData(profile);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading admin profile:', error);
        this.toastService.show('Failed to load profile data');
        this.isLoading = false;
      },
    });
  }

  /**
   * Map API profile response to component profileData
   */
  mapProfileToData(profile: AdminProfile): void {
    this.profileData = {
      name: profile.name || '',
      email: profile.email || '',
      contact: profile.phone_number || '',
      line1: '', // Will be populated if admin_profile has address data
      line2: '',
      building: '',
      country: '',
      province: '',
      city: '',
      postalCode: '',
      nationalId: profile.national_id || '',
    };

    // If admin_profile contains address information, map it
    if (profile.admin_profile) {
      const adminProfile = profile.admin_profile;
      this.profileData.line1 = adminProfile.address_line1 || '';
      this.profileData.line2 = adminProfile.address_line2 || '';
      this.profileData.building = adminProfile.building || '';
      this.profileData.country = adminProfile.country || '';
      this.profileData.province = adminProfile.province || '';
      this.profileData.city = adminProfile.city_id
        ? String(adminProfile.city_id)
        : '';
      this.profileData.postalCode = adminProfile.postal_code || '';
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.clearValidationErrors();
    }
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
  }

  saveProfile() {
    this.isSaving = true;
    this.clearValidationErrors();

    // Map component data to API request format
    const updateRequest: UpdateAdminProfileRequest = {
      name: this.profileData.name,
      email: this.profileData.email,
      phone_number: this.profileData.contact,
      address_line1: this.profileData.line1,
      address_line2: this.profileData.line2,
      building: this.profileData.building,
      country: this.profileData.country,
      province: this.profileData.province,
      city_id: this.profileData.city
        ? String(this.profileData.city)
        : undefined,
      postal_code: this.profileData.postalCode,
      national_id: this.profileData.nationalId,
    };

    this.adminService.updateAdminProfile(updateRequest).subscribe({
      next: (response: UpdateAdminProfileResponse) => {
        this.toastService.show('Profile updated successfully');
        this.isEditing = false;
        this.isSaving = false;

        // Optionally reload the profile to ensure data consistency
        if (response.admin) {
          this.mapProfileToData(response.admin);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        console.error('Error updating profile:', error);

        if (error.status === 422 && error.error?.errors) {
          // Handle validation errors
          this.validationErrors = error.error.errors;
          this.validationMessage =
            error.error.message || 'Please correct the errors below';
        } else {
          // Handle other errors
          this.toastService.show('Failed to update profile. Please try again.');
        }
      },
    });
  }

  changePassword() {
    if (this.passwordData.newPassword === this.passwordData.confirmPassword) {
      this.showPasswordForm = false;
      this.passwordData = { newPassword: '', confirmPassword: '' };
    } else {
      alert('Passwords do not match!');
    }
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors(): void {
    this.validationErrors = {};
    this.validationMessage = '';
  }

  /**
   * Check if there are validation errors
   */
  get hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }

  /**
   * Normalize error message by removing underscores
   */
  normalizeErrorMessage(message: string): string {
    return message.replace(/_/g, ' ');
  }
}
