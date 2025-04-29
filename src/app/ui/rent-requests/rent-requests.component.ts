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

import { ArcElement, Tooltip, Legend } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  chartLabels = ['Residential', 'Commercial'];
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
      this.rentDataByMonth[this.selectedMonths] || this.rentDataByMonth['12']
    );
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: this.translatedLabels.length
      ? this.translatedLabels
      : this.chartLabels,
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

      this.updateChart(); // CHANGED: Now calls the helper method
    }
  }

  private updateChart(): void {
    // Force chart update
    if (this.chartDirective && this.chartDirective.chart) {
      this.chartDirective.chart.update();
    }
  }
}
