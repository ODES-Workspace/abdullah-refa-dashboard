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

interface ProfileData {
  name: string;
  email: string;
  contact: string;
  nationalId: string;
  line1: string;
  line2: string;
  building: string;
  country: string;
  province: string;
  city: string;
  postalCode: string;
}

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
  isLoading = false;
  isSaving = false;

  profileData: ProfileData = {
    name: '',
    email: '',
    contact: '',
    nationalId: '',
    line1: '',
    line2: '',
    building: '',
    country: '',
    province: '',
    city: '',
    postalCode: '',
  };

  // Validation error handling
  validationErrors: { [key: string]: string[] } = {};
  validationMessage = '';
  errorMessages: string[] = [];

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
      nationalId: profile.national_id || '',
      line1: '',
      line2: '',
      building: '',
      country: '',
      province: '',
      city: '',
      postalCode: '',
    };

    // Map city data from the main profile object
    if (profile.city) {
      this.profileData.city = String(profile.city.id);
    }

    // If admin_profile contains address information, map it
    if (profile.admin_profile) {
      const adminProfile = profile.admin_profile;
      this.profileData.line1 = adminProfile.address_line1 || '';
      this.profileData.line2 = adminProfile.address_line2 || '';
      this.profileData.building = adminProfile.building || '';
      this.profileData.country = adminProfile.country || '';
      this.profileData.province = adminProfile.province || '';
      this.profileData.postalCode = adminProfile.postal_code || '';
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.clearValidationErrors();
    }
  }

  saveProfile() {
    this.errorMessages = [];
    this.clearValidationErrors();

    const requiredErrors = this.validateRequired();
    if (requiredErrors.length) {
      this.errorMessages = requiredErrors;
      return;
    }

    this.isSaving = true;

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
        if (this.currentLang === 'ar') {
          this.toastService.show('تم تحديث البيانات بنجاح');
        } else {
          this.toastService.show('Profile updated successfully');
        }
        this.isEditing = false;
        this.isSaving = false;

        // Update user_data in localStorage with new name and email
        this.updateLocalStorageUserData();

        // Optionally reload the profile to ensure data consistency
        if (response.admin) {
          this.mapProfileToData(response.admin);
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        console.error('Error updating profile:', error);

        // Handle errors from admin service
        if (error.message) {
          // The admin service formats errors into a string with bullet points
          // Split by <br> and clean up the bullet points
          const errorMessages = error.message
            .split('<br>')
            .map((msg: string) => msg.replace('• ', '').trim())
            .filter((msg: string) => msg.length > 0);

          this.errorMessages = errorMessages;
        } else if (error.status === 422 && error.error?.errors) {
          // Handle validation errors directly if they exist
          this.validationErrors = error.error.errors;
          this.validationMessage =
            error.error.message || 'Please correct the errors below';
        } else {
          // Handle other errors
          this.captureErrors(error);
        }
      },
    });
  }

  /**
   * Validate required fields
   */
  private validateRequired(): string[] {
    const errors: string[] = [];
    const required: Array<[string, string | undefined]> = [
      ['Name', this.profileData.name],
      ['Email', this.profileData.email],
      ['Contact', this.profileData.contact],
      ['National ID', this.profileData.nationalId],
      ['Address Line 1', this.profileData.line1],
      ['Country', this.profileData.country],
      ['City', this.profileData.city],
      ['Postal Code', this.profileData.postalCode],
    ];

    required.forEach(([label, val]) => {
      if (val === undefined || val === null || String(val).trim() === '') {
        errors.push(`${label} is required`);
      }
    });

    return errors;
  }

  /**
   * Capture and format error messages
   */
  private captureErrors(err: any): void {
    const errors: string[] = [];
    const payload = err?.error;

    if (payload?.errors && typeof payload.errors === 'object') {
      Object.keys(payload.errors).forEach((field) => {
        const msgs = payload.errors[field];
        if (Array.isArray(msgs)) {
          msgs.forEach((m) => errors.push(m));
        }
      });
    }

    if (errors.length === 0 && payload?.message) {
      errors.push(payload.message);
    }

    if (errors.length === 0 && typeof err?.message === 'string') {
      errors.push(err.message);
    }

    if (errors.length === 0) {
      errors.push('An unexpected error occurred');
    }

    this.errorMessages = errors;
  }

  /**
   * Clear validation errors
   */
  clearValidationErrors(): void {
    this.validationErrors = {};
    this.validationMessage = '';
    this.errorMessages = [];
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

  /**
   * Update user_data in localStorage with new name and email
   */
  private updateLocalStorageUserData(): void {
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);

        // Update name and email in user_data
        userData.name = this.profileData.name;
        userData.email = this.profileData.email;

        // Save updated user_data back to localStorage
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating localStorage user_data:', error);
    }
  }
}
