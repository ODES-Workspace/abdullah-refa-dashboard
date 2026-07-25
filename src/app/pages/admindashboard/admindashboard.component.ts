import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
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
import { ContractsService, Contract } from '../../../services/contracts.service';

// A single unpaid installment (or down payment) surfaced on the dashboard.
interface DuePaymentRow {
  rentRequestId: number;
  tenantName: string;
  propertyName: string;
  dueDate: string;
  amount: number;
  status: 'overdue' | 'upcoming';
}

@Component({
  selector: 'app-admindashboard',
  imports: [
    NgFor,
    NgClass,
    NgIf,
    DecimalPipe,
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
  // Upcoming + late payments across all contracts (unpaid schedule entries).
  duePayments: DuePaymentRow[] = [];

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
      title: 'Total Customers',
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

  constructor(
    private dashboardService: DashboardService,
    private contractsService: ContractsService
  ) {}

  ngOnInit() {
    this.loadAdminDashboard();
    this.loadDuePayments();
  }

  // Build the "Upcoming & Late Payments" table from every contract's
  // payment_schedule (API data). We keep only unpaid entries and derive the
  // status the same way as the schedule tab: late = past due, else upcoming.
  loadDuePayments() {
    this.contractsService.getContracts(1, 1000).subscribe({
      next: (res) => {
        const rows: DuePaymentRow[] = [];
        (res.data || []).forEach((contract: Contract) => {
          const tenantName = contract.rent_request?.name || '-';
          const propertyName =
            contract.rent_request?.property?.name_en ||
            contract.rent_request?.property?.name_ar ||
            '-';
          // Schedule is chronological. Surface every overdue (unpaid, past due)
          // entry plus only the single next upcoming one per contract, so the
          // table stays a concise "what needs attention" view.
          let nextUpcomingTaken = false;
          (contract.payment_schedule || []).forEach((item) => {
            if (item.is_paid) return;
            const overdue = this.isPastDue(item.due_date);
            if (!overdue) {
              if (nextUpcomingTaken) return;
              nextUpcomingTaken = true;
            }
            rows.push({
              rentRequestId: contract.rent_request_id,
              tenantName,
              propertyName,
              dueDate: item.due_date,
              amount: Number(item.amount || 0),
              status: overdue ? 'overdue' : 'upcoming',
            });
          });
        });
        // Most urgent first (oldest due date at the top).
        rows.sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        this.duePayments = rows;
      },
      error: (error: any) => {
        console.error('Error loading due payments:', error);
        this.duePayments = [];
      },
    });
  }

  private isPastDue(dueDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
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
        title: 'Total Customers',
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
