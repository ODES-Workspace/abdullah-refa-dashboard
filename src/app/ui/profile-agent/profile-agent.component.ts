import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

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
export class ProfileAgentComponent {
  isEditing = false;
  falLicenseDocument: string | null = null;

  profileData: ProfileData = {
    agencyName: 'REFA Admin',
    Mobile: '+966503612823',
    EmailAddress: 'admin@refa.com',
    CompanyRegistrationID: '123',
    FALLicenseID: 'Riyadh1111',
    Line1: '123, Rayhanah Bint Zaid',
    Line2: 'Saudi Arabia',
    Country: 'Al-Bahah',
    City: 'Al-Bahah',
    postalCode: '123',
    accountNumber: '123',
    bankName: 'Al-Bahah',
    IBAN: '123',
  };

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveProfile() {
    this.isEditing = false;
  }

  onFalLicenseDocumentChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      this.falLicenseDocument = URL.createObjectURL(file);
    }
  }

  removeFalLicenseDocument() {
    if (this.falLicenseDocument) {
      if (this.falLicenseDocument.startsWith('blob:')) {
        URL.revokeObjectURL(this.falLicenseDocument);
      }
      this.falLicenseDocument = null;
    }
  }
}
