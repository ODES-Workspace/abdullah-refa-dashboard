import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableComponent } from '../../ui/agent-agencies-table/agent-agencies-table.component';
import { AgentdashboardchartsComponent } from '../../ui/agentdashboardcharts/agentdashboardcharts.component';

@Component({
  selector: 'app-agentdashboard',
  imports: [
    NgFor,
    NgIf,
    NgClass,
    TranslateModule,
    TableComponent,
    AgentdashboardchartsComponent,
  ],
  templateUrl: './agentdashboard.component.html',
  styleUrl: './agentdashboard.component.scss',
})
export class AgentdashboardComponent {
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
