import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent {
  paymentData = {
    ejarFee: '25 SAR',
    agentFee: '2.5 %',
    refaProcessingFee: '150 SAR',
  };

  editingField: string | null = null;
  tempValues = {
    ejarFee: '',
    agentFee: '',
    refaProcessingFee: '',
  };

  startEditing(field: string) {
    this.editingField = field;
    this.tempValues[field as keyof typeof this.tempValues] =
      this.paymentData[field as keyof typeof this.paymentData];
  }

  saveChanges(field: string) {
    this.paymentData[field as keyof typeof this.paymentData] =
      this.tempValues[field as keyof typeof this.tempValues];
    this.editingField = null;
  }
}
