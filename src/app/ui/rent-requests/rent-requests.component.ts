import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  Input,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ArcElement, Tooltip, Legend } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RentRequest } from '../../../services/dashboard.service';
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
  imports: [CommonModule, FormsModule, NgChartsModule, TranslateModule],
  templateUrl: './rent-requests.component.html',
  styleUrls: ['./rent-requests.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentRequestsComponent implements OnInit {
  @Input() rentRequests: RentRequest[] = [];

  chartLabels: string[] = [];
  translatedLabels: string[] = [];
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
      accepted: 0,
      rejected: 0,
      underReview: 0,
      residential: 0,
      commercial: 0,
    },
    '3': {
      months: '3 months',
      accepted: 0,
      rejected: 0,
      underReview: 0,
      residential: 0,
      commercial: 0,
    },
    '6': {
      months: '6 months',
      accepted: 0,
      rejected: 0,
      underReview: 0,
      residential: 0,
      commercial: 0,
    },
    '12': {
      months: '12 months',
      accepted: 0,
      rejected: 0,
      underReview: 0,
      residential: 0,
      commercial: 0,
    },
  };

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
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label: any, i: number) => {
              const meta = chart.getDatasetMeta(0);
              const value = datasets[0].data[i];
              const backgroundColor = datasets[0].backgroundColor[i];

              return {
                text: `${label} ${value}%`,
                fillStyle: backgroundColor,
                strokeStyle: datasets[0].borderColor,
                lineWidth: datasets[0].borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i,
                borderRadius: datasets[0].borderRadius,
              };
            });
          },
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
      this.realRentDataByMonth[this.selectedMonths] ||
      this.realRentDataByMonth['12']
    );
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#0311D0',
          '#26E8BE',
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
        ],
        borderWidth: 1,
        borderRadius: 2,
        borderColor: '#FFFFFF',
        hoverBackgroundColor: [
          '#0311D0',
          '#26E8BE',
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
        ],
        spacing: 1,
      },
    ],
  };

  // Reference to the chart
  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.translateService.onLangChange.subscribe(() => {
      this.translateLabels();
    });
    // Initialize chart data
    this.updateChartData();
  }

  translateLabels(): void {
    this.translatedLabels = [];
    this.chartLabels.forEach((label) => {
      this.translateService
        .get(`CHART.${label.toUpperCase()}`)
        .subscribe((translation) => {
          this.translatedLabels.push(translation);
          // Update chart data labels
          if (
            this.donutChartData &&
            this.translatedLabels.length === this.chartLabels.length
          ) {
            this.donutChartData.labels = [...this.translatedLabels];
            this.updateChart();
          }
        });
    });

    // Update chart data when language changes to refresh property types
    if (this.rentRequests && this.rentRequests.length > 0) {
      this.updateChartData();
    }
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

  // Method to update chart data with real property type data
  private updateChartData(): void {
    if (
      this.donutChartData &&
      this.donutChartData.datasets &&
      this.donutChartData.datasets[0]
    ) {
      if (this.rentRequests && this.rentRequests.length > 0) {
        // Get current data for selected time period
        const now = new Date();
        const fromDate = this.getDateFromMonths(parseInt(this.selectedMonths));
        const filteredRequests = this.rentRequests.filter((request) => {
          const requestDate = new Date(request.created_at);
          return requestDate >= fromDate && requestDate <= now;
        });

        // Calculate property type counts based on current language
        const propertyTypeCounts = new Map<string, number>();
        const currentLang = this.translateService.currentLang;

        filteredRequests.forEach((request) => {
          const propertyType =
            currentLang === 'ar'
              ? request.property.type.name_ar
              : request.property.type.name_en;
          propertyTypeCounts.set(
            propertyType,
            (propertyTypeCounts.get(propertyType) || 0) + 1
          );
        });

        // Update chart labels and data
        const propertyTypes = Array.from(propertyTypeCounts.keys());
        const counts = Array.from(propertyTypeCounts.values());

        if (propertyTypes.length > 0) {
          this.donutChartData.labels = propertyTypes;
          this.donutChartData.datasets[0].data = counts;
        } else {
          this.donutChartData.labels = ['No data'];
          this.donutChartData.datasets[0].data = [100];
        }
      } else {
        // Fallback to no data
        this.donutChartData.labels = ['No data'];
        this.donutChartData.datasets[0].data = [100];
      }

      this.updateChart();
    }
  }

  private getDateFromMonths(months: number): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  }

  private updateChart(): void {
    // Force chart update
    if (this.chartDirective && this.chartDirective.chart) {
      this.chartDirective.chart.update();
    }
  }

  // Watch for changes in rent requests input
  ngOnChanges() {
    if (this.rentRequests && this.rentRequests.length > 0) {
      this.updateChartData();
    }
  }

  private calculateRentData(fromDate: Date, toDate: Date): RentData {
    const filteredRequests = this.rentRequests.filter((request) => {
      const requestDate = new Date(request.created_at);
      return requestDate >= fromDate && requestDate <= toDate;
    });

    const total = filteredRequests.length;
    if (total === 0) {
      return {
        months: 'No data',
        accepted: 0,
        rejected: 0,
        underReview: 0,
        residential: 0,
        commercial: 0,
      };
    }

    const accepted = filteredRequests.filter(
      (r) => r.status === 'approved'
    ).length;
    const rejected = filteredRequests.filter(
      (r) => r.status === 'rejected'
    ).length;
    const underReview = filteredRequests.filter(
      (r) => r.status === 'pending'
    ).length;

    // For backward compatibility, still calculate residential/commercial
    const residential = filteredRequests.filter(
      (r) => r.property.category.name_en.toLowerCase() === 'residential'
    ).length;
    const commercial = filteredRequests.filter(
      (r) => r.property.category.name_en.toLowerCase() === 'commercial'
    ).length;

    return {
      months: `${total} requests`,
      accepted: Math.round((accepted / total) * 100),
      rejected: Math.round((rejected / total) * 100),
      underReview: Math.round((underReview / total) * 100),
      residential: Math.round((residential / total) * 100),
      commercial: Math.round((commercial / total) * 100),
    };
  }

  // Calculate real data from rent requests when available
  get realRentDataByMonth(): { [key: string]: RentData } {
    if (!this.rentRequests || this.rentRequests.length === 0) {
      return this.rentDataByMonth;
    }

    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate()
    );
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate()
    );
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 12,
      now.getDate()
    );

    return {
      '1': this.calculateRentData(oneMonthAgo, now),
      '3': this.calculateRentData(threeMonthsAgo, now),
      '6': this.calculateRentData(sixMonthsAgo, now),
      '12': this.calculateRentData(twelveMonthsAgo, now),
    };
  }
}
