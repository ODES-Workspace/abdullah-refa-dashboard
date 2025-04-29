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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  imports: [CommonModule, FormsModule, NgChartsModule, TranslateModule],
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

  // Donut Chart Configuration
  public donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    radius: '90%',
    animation: {
      duration: 0, // Disable animations
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label: string, i: number) => {
              const total = datasets[0].data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = ((datasets[0].data[i] / total) * 100).toFixed(
                0
              );
              return {
                text: `${label} ${percentage}%`,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: datasets[0].borderColor,
                lineWidth: datasets[0].borderWidth,
                hidden:
                  isNaN(datasets[0].data[i]) ||
                  chart.getDatasetMeta(0).data[i].hidden,
                index: i,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          },
        },
      },
      datalabels: {
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce(
            (a: number, b: number) => a + b,
            0
          );
          return ((value / total) * 100).toFixed(1) + '%';
        },
        color: '#fff',
        font: {
          weight: 'bold',
        },
      },
    },
    layout: {
      padding: 10,
    },
  } as ChartConfiguration['options'];

  public donutChartType: ChartType = 'doughnut';
  public donutChartLegend = true;

  constructor(private translate: TranslateService) {
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(() => {
      this.updateChartLabels();
    });
  }

  get currentData(): RentData {
    return (
      this.rentDataByMonth[this.selectedMonths] || this.rentDataByMonth['12']
    );
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: ['', ''],
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
    this.updateChartData();
  }

  private updateChartData(): void {
    if (
      this.donutChartData &&
      this.donutChartData.datasets &&
      this.donutChartData.datasets[0]
    ) {
      // Update dataset values
      this.donutChartData.datasets[0].data[0] = this.currentData.residential;
      this.donutChartData.datasets[0].data[1] = this.currentData.commercial;

      // Force chart update
      if (this.chartDirective && this.chartDirective.chart) {
        this.chartDirective.chart.update();
      }
    }
  }

  private updateChartLabels(): void {
    if (this.donutChartData) {
      this.translate
        .get(['rentRequests.residential', 'rentRequests.commercial'])
        .subscribe((translations) => {
          this.donutChartData.labels = [
            translations['rentRequests.residential'],
            translations['rentRequests.commercial'],
          ];
          if (this.chartDirective?.chart) {
            this.chartDirective.chart.update();
          }
        });
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
    this.updateChartData();
  }
}
