import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  AdminService,
  ApplicationSettings,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { ToastComponent } from '../toast/toast.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ToastComponent,
    KeyValuePipe,
  ],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent implements OnInit {
  paymentData = {
    ejarFee: '',
    agentFee: '',
    refaProcessingFee: '',
  };

  editingField: string | null = null;
  tempValues = {
    ejarFee: '',
    agentFee: '',
    refaProcessingFee: '',
  };

  // Loading and error states
  isLoading = false;
  isSaving = false;

  // Validation error handling
  validationErrors: { [key: string]: string[] } = {};
  validationMessage = '';

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadApplicationSettings();
  }

  /**
   * Load application settings data from the API
   */
  loadApplicationSettings(): void {
    this.isLoading = true;
    this.adminService.getApplicationSettings().subscribe({
      next: (settings: ApplicationSettings) => {
        this.mapSettingsToData(settings);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading application settings:', error);
        this.toastService.show('Failed to load settings data');
        this.isLoading = false;
      },
    });
  }

  /**
   * Map API settings response to component paymentData
   */
  mapSettingsToData(settings: ApplicationSettings): void {
    this.paymentData = {
      ejarFee: `${settings.eijar_fees} SAR`,
      agentFee: `${settings.agent_fees} %`,
      refaProcessingFee: `${settings.processing_fees} SAR `,
    };
  }

  /**
   * Get the unit suffix for each field
   */
  getFieldUnit(field: string): string {
    const unitMap: { [key: string]: string } = {
      ejarFee: 'SAR',
      agentFee: '%',
      refaProcessingFee: 'SAR',
    };
    return unitMap[field] || '';
  }

  startEditing(field: string) {
    this.editingField = field;
    // Store only the numeric value in tempValues
    const numericValue = this.extractNumericValue(
      this.paymentData[field as keyof typeof this.paymentData]
    );
    this.tempValues[field as keyof typeof this.tempValues] =
      numericValue.toString();
    this.clearValidationErrors();
  }

  saveChanges(field: string) {
    this.isSaving = true;
    this.clearValidationErrors();

    // Extract numeric value from the temp value (remove SAR, %, etc.)
    const numericValue = this.extractNumericValue(
      this.tempValues[field as keyof typeof this.tempValues]
    );

    // Map field to API field name
    const apiFieldMap: { [key: string]: keyof UpdateSettingsRequest } = {
      ejarFee: 'eijar_fees',
      agentFee: 'agent_fees',
      refaProcessingFee: 'processing_fees',
    };

    const apiField = apiFieldMap[field];
    if (!apiField) {
      this.toastService.show('Invalid field');
      this.isSaving = false;
      return;
    }

    // Build update request
    const updateRequest: UpdateSettingsRequest = {
      [apiField]: numericValue,
    };

    this.adminService.updateApplicationSettings(updateRequest).subscribe({
      next: (response: UpdateSettingsResponse) => {
        this.toastService.show('Settings updated successfully');
        // Reconstruct the formatted value with unit
        const unit = this.getFieldUnit(field);
        this.paymentData[
          field as keyof typeof this.paymentData
        ] = `${numericValue} ${unit}`;
        this.editingField = null;
        this.isSaving = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        console.error('Error updating settings:', error);

        if (error.status === 422 && error.error?.errors) {
          // Handle validation errors
          this.validationErrors = error.error.errors;
          this.validationMessage =
            error.error.message || 'Please correct the errors below';
        } else {
          // Handle other errors
          this.toastService.show(
            'Failed to update settings. Please try again.'
          );
        }
      },
    });
  }

  /**
   * Extract numeric value from formatted string (e.g., "25 SAR" -> 25)
   */
  extractNumericValue(value: string): number {
    const numericMatch = value.match(/\d+(\.\d+)?/);
    return numericMatch ? parseFloat(numericMatch[0]) : 0;
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
