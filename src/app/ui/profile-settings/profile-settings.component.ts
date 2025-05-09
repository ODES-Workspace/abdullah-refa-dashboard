import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent {
  isEditing = false;
  showPasswordForm = false;

  profileData = {
    name: 'REFA Admin',
    email: 'admin@refa.com',
    contact: '+966503612823',
    line1: '123, Rayhanah Bint Zaid',
    line2: 'Riyadh1111',
    building: '123',
    country: 'Saudi Arabia',
    province: 'Al-Bahah',
    city: 'Al-Bahah',
    postalCode: '123',
  };

  passwordData = {
    newPassword: '',
    confirmPassword: '',
  };

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
  }

  saveProfile() {
    this.isEditing = false;
  }

  changePassword() {
    if (this.passwordData.newPassword === this.passwordData.confirmPassword) {
      this.showPasswordForm = false;
      this.passwordData = { newPassword: '', confirmPassword: '' };
    } else {
      alert('Passwords do not match!');
    }
  }
}
