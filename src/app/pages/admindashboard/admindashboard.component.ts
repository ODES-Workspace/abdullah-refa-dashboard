import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RentRequestsComponent } from '../../ui/rent-requests/rent-requests.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admindashboard',
  imports: [NgFor, NgIf, NgClass, RentRequestsComponent, TranslateModule],
  templateUrl: './admindashboard.component.html',
  styleUrl: './admindashboard.component.scss',
})
export class AdmindashboardComponent {
  stats = [
    {
      title: 'Total Properties',
      value: 8,
      icon: '/assets/icons/properties-icon.svg',
      percentageChange: 8,
    },
    {
      title: 'Total Tenants',
      value: 1,
      icon: '/assets/icons/tenants-icon.svg',
    },
    { title: 'Total Users', value: 0, icon: '/assets/icons/users-icon.svg' },
    {
      title: 'Total Agencies-Owner',
      value: 8,
      icon: '/assets/icons/agenciesowner-icon.svg',
      percentageChange: -12,
    },
    {
      title: 'Total Rent Request',
      value: 2,
      icon: '/assets/icons/rent-icon.svg',
    },
    {
      title: 'Total Contracts',
      value: 0,
      icon: '/assets/icons/contracts-icon.svg',
    },
  ];

  financialCards = [
    {
      title: 'CONTRACT AMOUNTS',
      value: '20,000,000',
      icon: '/assets/icons/contract-amounts.svg',
    },
    {
      title: 'REFA FEES',
      value: '3500',
      icon: '/assets/icons/refa-fees.svg',
    },
  ];

  // Helper function to determine percentage color
  getPercentageClass(change: number | undefined): string {
    if (change === undefined) return '';
    return change >= 0 ? 'percentage-positive' : 'percentage-negative';
  }

  // Helper function to format percentage
  formatPercentage(change: number | undefined): string {
    if (change === undefined) return '';
    return `${change > 0 ? '+' : ''}${change}%`;
  }
}
