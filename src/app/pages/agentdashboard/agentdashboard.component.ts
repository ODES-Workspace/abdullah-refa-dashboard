import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  constructor() {}

  ngOnInit(): void {
    // Set static values for stats instead of API calls
    this.stats[0].value = 25; // Total Properties
    this.stats[1].value = 150; // Total Rent Request
    this.stats[2].value = 120; // Accepted Requests
    this.stats[3].value = 30; // Rejected Requests
    this.stats[4].value = 450000; // Total Rent Value
  }
}

interface Stat {
  title: string;
  value: number;
  icon: string;
  percentageChange?: number;
}
