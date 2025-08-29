import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableComponent } from '../../ui/agent-agencies-table/agent-agencies-table.component';
import { AgentdashboardchartsComponent } from '../../ui/agentdashboardcharts/agentdashboardcharts.component';
import { RentRequestsService } from '../../../services/rent-requests.service';
import { ContractsService } from '../../../services/contracts.service';

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
export class AgentdashboardComponent implements OnInit {
  stats: Stat[] = [
    {
      title: 'Total Properties',
      value: 0,
      icon: '/assets/icons/properties-icon.svg',
    },
    {
      title: 'Total Rent Request',
      value: 0,
      icon: '/assets/icons/rent-icon.svg',
    },
    {
      title: 'Accepted Requests',
      value: 0,
      icon: '/assets/icons/accepted-req.svg',
    },

    {
      title: 'Rejected Requests',
      value: 0,
      icon: '/assets/icons/rejected-req.svg',
    },

    {
      title: 'Total Rent Value',
      value: 0,
      icon: '/assets/icons/rent-val.svg',
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

  constructor(
    private rentRequestsService: RentRequestsService,
    private contractsService: ContractsService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    // Rent requests: total, approved, rejected, and infer total properties from unique property ids (approx)
    this.rentRequestsService.getRentRequests(1).subscribe({
      next: (res) => {
        const items = res.data || [];
        const approved = items.filter(
          (i: any) => i.status === 'approved'
        ).length;
        const rejected = items.filter(
          (i: any) => i.status === 'rejected'
        ).length;
        const uniquePropertyIds = new Set<number>();
        items.forEach((i: any) => {
          if (i.property_id) uniquePropertyIds.add(i.property_id);
        });

        // Total Rent Request
        this.stats[1].value = res.total ?? items.length;
        // Accepted Requests (from current page)
        this.stats[2].value = approved;
        // Rejected Requests (from current page)
        this.stats[3].value = rejected;
        // Total Properties (approx from current page)
        const currentTotalProps = uniquePropertyIds.size;
        this.stats[0].value = currentTotalProps;

        // percentageChange for Total Properties vs last stored value
        const prevRaw = localStorage.getItem('agent_prev_total_properties');
        const prevTotal = prevRaw ? parseInt(prevRaw, 10) : 0;
        if (!isNaN(prevTotal) && prevTotal > 0 && (this.stats[0] as any)) {
          const delta = currentTotalProps - prevTotal;
          const pct = Math.round((delta / prevTotal) * 100);
          (this.stats[0] as any).percentageChange = pct;
        } else {
          // No previous baseline; omit percentage or set 0
          (this.stats[0] as any).percentageChange = 0;
        }
        localStorage.setItem(
          'agent_prev_total_properties',
          String(currentTotalProps)
        );
      },
      error: () => {
        // Leave defaults on error
      },
    });

    // Contracts: compute total rent value sum of annual_rent in current page
    this.contractsService.getContracts(1).subscribe({
      next: (res) => {
        const items = res.data || [];
        const totalRent = items.reduce((sum: number, c: any) => {
          const rent = Number(c?.rent_request?.property?.annual_rent) || 0;
          return sum + rent;
        }, 0);
        this.stats[4].value = totalRent;
      },
      error: () => {
        // Keep default 0 on error
      },
    });
  }
}

interface Stat {
  title: string;
  value: number;
  icon: string;
  percentageChange?: number;
}
