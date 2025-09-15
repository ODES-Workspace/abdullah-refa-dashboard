import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { RentRequestsComponent } from '../../ui/rent-requests/rent-requests.component';
import { TranslateModule } from '@ngx-translate/core';
import { TableComponent } from '../../ui/agent-agencies-table/agent-agencies-table.component';
import {
  DashboardService,
  AdminDashboardResponse,
  RentRequest,
} from '../../../services/dashboard.service';

@Component({
  selector: 'app-admindashboard',
  imports: [
    NgFor,
    RentRequestsComponent,
    TranslateModule,
    TableComponent,
    RouterModule,
  ],
  templateUrl: './admindashboard.component.html',
  styleUrl: './admindashboard.component.scss',
})
export class AdmindashboardComponent implements OnInit {
  rentRequests: RentRequest[] = [];

  stats = [
    {
      title: 'Total Properties',
      value: 0,
      icon: '/assets/icons/properties-icon.svg',
      route: '/admin/properties',
    },
    {
      title: 'Total Tenants',
      value: 0,
      icon: '/assets/icons/tenants-icon.svg',
      route: '/admin/tenants',
    },
    {
      title: 'Total Users',
      value: 0,
      icon: '/assets/icons/users-icon.svg',
      route: '/admin/users',
    },
    {
      title: 'Total Agencies-Owner',
      value: 0,
      icon: '/assets/icons/agenciesowner-icon.svg',
      route: '/admin/agencies-owner-approvals',
    },
    {
      title: 'Total Rent Request',
      value: 0,
      icon: '/assets/icons/rent-icon.svg',
      route: '/admin/rentrequests',
    },
    {
      title: 'Total Contracts',
      value: 0,
      icon: '/assets/icons/contracts-icon.svg',
      route: '/admin/existing-contract',
    },
  ];

  financialCards = [
    {
      title: 'CONTRACT AMOUNTS',
      value: '0',
      icon: '/assets/icons/contract-amounts.svg',
    },
    {
      title: 'REFA FEES',
      value: '0',
      icon: '/assets/icons/refa-fees.svg',
    },
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadAdminDashboard();
  }

  loadAdminDashboard() {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (data: AdminDashboardResponse) => {
        console.log('Admin Dashboard Response:', data);
        this.rentRequests = data.rent_requests;
        this.updateDashboardData(data);
      },
      error: (error: any) => {
        console.error('Error loading admin dashboard:', error);
      },
    });
  }

  updateDashboardData(data: AdminDashboardResponse) {
    // Update stats with real data from API
    this.stats = [
      {
        title: 'Total Properties',
        value: data.total_properties,
        icon: '/assets/icons/properties-icon.svg',
        route: '/admin/properties',
      },
      {
        title: 'Total Tenants',
        value: data.total_tenants,
        icon: '/assets/icons/tenants-icon.svg',
        route: '/admin/tenants',
      },
      {
        title: 'Total Users',
        value: data.total_users,
        icon: '/assets/icons/users-icon.svg',
        route: '/admin/users',
      },
      {
        title: 'Total Agencies-Owner',
        value: data.total_agents,
        icon: '/assets/icons/agenciesowner-icon.svg',
        route: '/admin/agencies-owner-approvals',
      },
      {
        title: 'Total Rent Request',
        value: data.total_rent_requests,
        icon: '/assets/icons/rent-icon.svg',
        route: '/admin/rentrequests',
      },
      {
        title: 'Total Contracts',
        value: data.total_contracts,
        icon: '/assets/icons/contracts-icon.svg',
        route: '/admin/existing-contract',
      },
    ];

    // Update financial cards with real data from API
    this.financialCards = [
      {
        title: 'CONTRACT AMOUNTS',
        value: data.total_contract_amounts,
        icon: '/assets/icons/contract-amounts.svg',
      },
      {
        title: 'REFA FEES',
        value: data.total_refa_fees.toString(),
        icon: '/assets/icons/refa-fees.svg',
      },
    ];
  }

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
