import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { default as ChartDataLabels } from 'chartjs-plugin-datalabels';

import { ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

interface RentData {
  months: string;
  accepted: number;
  rejected: number;
  underReview: number;
  residential: number;
  commercial: number;
}

@Component({
  selector: 'app-rent-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './rent-requests.component.html',
  styleUrls: ['./rent-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentRequestsComponent implements OnInit {
  selectedMonths: string = '12';
  monthOptions = [
    { value: '1', label: '1 month' },
    { value: '3', label: '3 months' },
    { value: '6', label: '6 months' },
    { value: '12', label: '12 months' },
  ];

  rentDataByMonth: { [key: string]: RentData } = {
    '1': {
      months: '1 month',
      accepted: 35,
      rejected: 50,
      underReview: 15,
      residential: 15,
      commercial: 85,
    },
    '3': {
      months: '3 months',
      accepted: 38,
      rejected: 52,
      underReview: 20,
      residential: 18,
      commercial: 82,
    },
    '6': {
      months: '6 months',
      accepted: 40,
      rejected: 53,
      underReview: 23,
      residential: 19,
      commercial: 81,
    },
    '12': {
      months: '12 months',
      accepted: 40,
      rejected: 55,
      underReview: 25,
      residential: 20,
      commercial: 80,
    },
  };

  // Translation system with type safety
  private translations: Record<string, { ltr: string; rtl: string }> = {
    Residential: { ltr: 'Residential', rtl: 'سكني' },
    Commercial: { ltr: 'Commercial', rtl: 'تجاري' },
  };
  private currentDirection: 'ltr' | 'rtl' = 'ltr';

  // Donut Chart Configuration
  public donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    radius: '90%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw}%`,
        },
      },
    },
    layout: {
      padding: 10,
    },
  } as ChartConfiguration['options'];

  public donutChartType: ChartType = 'doughnut';
  public donutChartLegend = true;

  get currentData(): RentData {
    return (
      this.rentDataByMonth[this.selectedMonths] || this.rentDataByMonth['12']
    );
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: ['Residential', 'Commercial'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#0311D0', '#26E8BE'],
        borderWidth: 1,
        borderRadius: 2,
        borderColor: '#FFFFFF',
        hoverBackgroundColor: ['#0311D0', '#26E8BE'],
        spacing: 1,
      },
    ],
  };

  // Reference to the chart
  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  ngOnInit(): void {
    // Initialize chart data
    this.updateChartData();
  }

  getRequestMax(): number {
    const data = this.currentData;
    return Math.max(data.accepted, data.rejected, data.underReview);
  }

  calculateWidth(value: number, max: number): number {
    return (value / max) * 100;
  }

  onMonthChange(months: string): void {
    this.selectedMonths = months;

    // Update chart data and force redraw
    setTimeout(() => {
      this.updateChartData();
    });
  }

  // Method to update chart data without creating new references
  private updateChartData(): void {
    if (
      this.donutChartData &&
      this.donutChartData.datasets &&
      this.donutChartData.datasets[0]
    ) {
      // Update dataset values
      this.donutChartData.datasets[0].data[0] = this.currentData.residential;
      this.donutChartData.datasets[0].data[1] = this.currentData.commercial;

      // Update labels based on direction
      this.donutChartData.labels = [
        this.translations['Residential'][this.currentDirection],
        this.translations['Commercial'][this.currentDirection],
      ];

      // Force chart update
      if (this.chartDirective && this.chartDirective.chart) {
        this.chartDirective.chart.update();
      }
    }
  }
}
