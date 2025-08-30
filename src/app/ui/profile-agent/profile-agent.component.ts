import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  ProfileAgentService,
  AgentProfileResponse,
} from '../../../services/profile-agent.service';
import { UserRoleService } from '../../../services/user-role.service';

interface ProfileData {
  agencyName: string;
  Mobile: string;
  EmailAddress: string;
  CompanyRegistrationID: string;
  FALLicenseID: string;
  Line1: string;
  Line2: string;
  Country: string;
  City: string;
  postalCode: string;
  accountNumber: string;
  bankName: string;
  IBAN: string;
}

@Component({
  selector: 'app-profile-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile-agent.component.html',
  styleUrl: './profile-agent.component.scss',
})
export class ProfileAgentComponent implements OnInit {
  isEditing = false;
  falLicenseDocument: string | null = null;
  private falDocumentFile: File | null = null;
  errorMessages: string[] = [];

  profileData: ProfileData = {
    agencyName: '',
    Mobile: '',
    EmailAddress: '',
    CompanyRegistrationID: '',
    FALLicenseID: '',
    Line1: '',
    Line2: '',
    Country: '',
    City: '',
    postalCode: '',
    accountNumber: '',
    bankName: '',
    IBAN: '',
  };

  constructor(
    private profileAgentService: ProfileAgentService,
    private userRoleService: UserRoleService
  ) {}

  ngOnInit(): void {
    this.profileAgentService.getMyProfile().subscribe({
      next: (res: AgentProfileResponse) => {
        const p = res.agent_profile;
        // Map API → UI model
        this.profileData = {
          agencyName: p?.agency_name || res.name || '',
          Mobile: res.phone_number || '',
          EmailAddress: res.email || '',
          CompanyRegistrationID: p?.company_registration_id || '',
          FALLicenseID: p?.fal_license_number || '',
          Line1: p?.agency_address_line_1 || '',
          Line2: p?.agency_address_line_2 || '',
          Country: p?.country || '',
          City: p?.city || '',
          postalCode: p?.postal_code || '',
          accountNumber: p?.account_number || '',
          bankName: p?.bank_name || '',
          IBAN: p?.iban_number || '',
        };

        // Document link if provided
        this.falLicenseDocument = p?.fal_document || null;
      },
      error: (err) => {
        console.error('Failed to fetch agent profile:', err);
      },
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.errorMessages = [];
    const requiredErrors = this.validateRequired();
    if (requiredErrors.length) {
      this.errorMessages = requiredErrors;
      return;
    }
    const payload = {
      agency_name: this.profileData.agencyName || undefined,
      company_registration_id:
        this.profileData.CompanyRegistrationID || undefined,
      fal_license_number: this.profileData.FALLicenseID || undefined,
      fal_document: this.falDocumentFile,
      agency_address_line_1: this.profileData.Line1 || undefined,
      agency_address_line_2: this.profileData.Line2 || undefined,
      city: this.profileData.City || undefined,
      country: this.profileData.Country || undefined,
      postal_code: this.profileData.postalCode || undefined,
      account_number: this.profileData.accountNumber || undefined,
      bank_name: this.profileData.bankName || undefined,
      iban_number: this.profileData.IBAN || undefined,
      email: this.profileData.EmailAddress || undefined,
      phone_number: this.profileData.Mobile || undefined,
    };

    this.profileAgentService.upsertMyProfile(payload).subscribe({
      next: (res) => {
        const p = res.agent_profile;
        if (p?.fal_document) {
          this.falLicenseDocument = p.fal_document;
        }
        // Overwrite localStorage user_data with latest top-level fields from API
        const updatedUser: any = {
          id: res.id,
          type: res.type,
          name: res.name,
          email: res.email,
          phone_number: res.phone_number,
          national_id: res.national_id,
          city_id: res.city_id ?? null,
          // normalize active to numeric 1/0 since consumers check === 1
          active:
            (typeof res.active === 'boolean'
              ? res.active
                ? 1
                : 0
              : res.active) ?? 0,
          role: res.role,
          city: res.city,
        };
        this.userRoleService.setUserData(updatedUser);
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Failed to update agent profile:', err);
        this.captureErrors(err);
      },
    });
  }

  onFalLicenseDocumentChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      this.falLicenseDocument = URL.createObjectURL(file);
      this.falDocumentFile = file;
    }
  }

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

  private validateRequired(): string[] {
    const e: string[] = [];
    const required: Array<[string, string | undefined]> = [
      ['Agency name', this.profileData.agencyName],
      ['Email', this.profileData.EmailAddress],
      ['Contact', this.profileData.Mobile],
      ['Company Registration ID', this.profileData.CompanyRegistrationID],
      ['FAL License ID', this.profileData.FALLicenseID],
      // File required: ensure either an uploaded file in this session or an existing document link
      ['line1', this.profileData.Line1],
      ['line2', this.profileData.Line2],
      ['country', this.profileData.Country],
      ['City', this.profileData.City],
      ['Postal Code', this.profileData.postalCode],
      ['Bank Name', this.profileData.bankName],
      ['Account Number', this.profileData.accountNumber],
      ['IBAN', this.profileData.IBAN],
    ];
    required.forEach(([label, val]) => {
      if (val === undefined || val === null || String(val).trim() === '') {
        e.push(`${label} is required`);
      }
    });
    // Validate file: require either new upload or existing link
    if (!this.falDocumentFile && !this.falLicenseDocument) {
      e.push('FAL License Document is required');
    }
    return e;
  }

  removeFalLicenseDocument() {
    if (this.falLicenseDocument) {
      if (this.falLicenseDocument.startsWith('blob:')) {
        URL.revokeObjectURL(this.falLicenseDocument);
      }
      this.falLicenseDocument = null;
    }
    this.falDocumentFile = null;
  }
}
