import { RouterModule } from '@angular/router';
import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableComponent } from '../../ui/agent-agencies-table/agent-agencies-table.component';
import { AgentdashboardchartsComponent } from '../../ui/agentdashboardcharts/agentdashboardcharts.component';
import {
  DashboardService,
  AgentDashboardResponse,
} from '../../../services/dashboard.service';

@Component({
  selector: 'app-agentdashboard',
  imports: [
    NgFor,
    NgIf,
    NgClass,
    TranslateModule,
    TableComponent,
    AgentdashboardchartsComponent,
    RouterModule,
  ],
  templateUrl: './agentdashboard.component.html',
  styleUrl: './agentdashboard.component.scss',
})
export class AgentdashboardComponent implements OnInit {
  rentRequests: any[] = [];
  stats: Stat[] = [
    {
      title: 'Total Properties',
      value: 0,
      icon: '/assets/icons/properties-icon.svg',
      route: '/agent/properties',
    },
    {
      title: 'Total Rent Request',
      value: 0,
      icon: '/assets/icons/rent-icon.svg',
      route: '/agent/rentrequests',
    },
    {
      title: 'Accepted Requests',
      value: 0,
      icon: '/assets/icons/accepted-req.svg',
      route: '/agent/rentrequests',
    },
    {
      title: 'Rejected Requests',
      value: 0,
      icon: '/assets/icons/rejected-req.svg',
      route: '/agent/rejected-rentrequests',
    },
    {
      title: 'Total Rent Value',
      value: 0,
      icon: '/assets/icons/rent-val.svg',
      route: '/agent/existing-contract',
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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    // Load dashboard data from API
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.dashboardService.getAgentDashboard().subscribe({
      next: (response: AgentDashboardResponse) => {
        console.log('Agent Dashboard Response:', response);

        // Update stats with real data from API
        this.stats[0].value = response.total_properties;
        this.stats[1].value = response.total_rent_requests;
        this.stats[2].value = response.total_accepted_rent_requests;
        this.stats[3].value = response.total_rejected_rent_requests;
        this.stats[4].value = response.total_contract_amounts;

        // Pass rent requests data to charts component
        this.rentRequests = response.rent_requests;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);

        // Fallback to static values on error
        this.stats[0].value = 25; // Total Properties
        this.stats[1].value = 150; // Total Rent Request
        this.stats[2].value = 120; // Accepted Requests
        this.stats[3].value = 30; // Rejected Requests
        this.stats[4].value = 450000; // Total Rent Value
      },
    });
  }
}

interface Stat {
  title: string;
  value: number;
  icon: string;
  percentageChange?: number;
  route: string;
}
