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

import {
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
} from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RentRequestsService } from '../../../services/rent-requests.service';
import { PropertyTypesService } from '../../../services/property-types.service';
Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
);

interface PropertyInsights {
  months: string;
  totalInsights: number;
}

interface PropertyTypeData {
  villa: number;
  flats: number;
  apartments: number;
  independentHouse: number;
  gatedCommunity: number;
}

@Component({
  selector: 'app-agentdashboardcharts',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, TranslateModule],
  templateUrl: './agentdashboardcharts.component.html',
  styleUrl: './agentdashboardcharts.component.scss',
})
export class AgentdashboardchartsComponent implements OnInit {
  chartLabels = [
    'Villa',
    'Flats',
    'Apartments',
    'Independent House',
    'Gated Community',
  ];
  translatedLabels: string[] = [];
  selectedMonths: string = '12';
  monthOptions = [
    { value: '1', label: '1 month' },
    { value: '3', label: '3 months' },
    { value: '6', label: '6 months' },
    { value: '12', label: '12 months' },
  ];

  // Get last 12 months names
  private getLast12Months(): string[] {
    const months = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      months.push(date.toLocaleString('default', { month: 'long' }));
    }
    return months;
  }

  private translateMonths(): void {
    const months = this.getLast12Months();
    const translatedMonths: string[] = [];

    months.forEach((month) => {
      this.translateService
        .get(`MONTHS.${month.toUpperCase()}`)
        .subscribe((translation) => {
          translatedMonths.push(translation);
          if (translatedMonths.length === months.length) {
            this.lineChartData = {
              ...this.lineChartData,
              labels: [...translatedMonths],
            };
            this.updateLineChartData();
          }
        });
    });
  }

  private translateMonthsAndUpdate(): void {
    this.translateMonths();
  }

  // Line Chart Configuration
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 0.5,
          padding: 10,
          color: '#666',
          callback: function (tickValue: number | string) {
            if (typeof tickValue === 'number') {
              return tickValue.toFixed(1);
            }
            return tickValue;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          color: '#666',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) =>
            `Total Property Insights: ${context.raw.toFixed(1)}`,
        },
      },
    },
  };

  public lineChartType: ChartType = 'line';
  public lineChartLegend = false;

  public lineChartData: ChartConfiguration['data'] = {
    labels: this.getLast12Months(),
    datasets: [
      {
        data: Array(12).fill(0),
        label: '',
        backgroundColor: 'rgba(3, 17, 208, 0.1)',
        borderColor: '#0311D0',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#0311D0',
        pointHoverBackgroundColor: '#0311D0',
        pointHoverBorderColor: '#fff',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // DATA (populated from API)
  private monthlyCounts: number[] = Array(12).fill(0);
  private donutLabels: string[] = [];
  private donutCounts: number[] = [];
  private typeIdToName: { [id: number]: string } = {};
  private donutTypeIds: number[] = [];

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
              const backgroundColor = datasets[0].backgroundColor[i];

              return {
                text: label,
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
          label: (context: any) => context.label,
        },
      },
    },
    layout: {
      padding: 10,
    },
  } as ChartConfiguration['options'];

  public donutChartType: ChartType = 'doughnut';
  public donutChartLegend = true;

  get currentData(): PropertyInsights {
    const total = this.monthlyCounts
      .slice(-parseInt(this.selectedMonths))
      .reduce((a, b) => a + b, 0);
    return { months: '', totalInsights: total };
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: this.translatedLabels.length
      ? this.translatedLabels
      : this.chartLabels,
    datasets: [
      {
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          '#0311D0',
          '#26E8BE',
          '#FF6B6B',
          '#4ECDC4',
          '#FFD93D',
        ],
        borderWidth: 1,
        borderRadius: 2,
        borderColor: '#FFFFFF',
        hoverBackgroundColor: [
          '#0311D0',
          '#26E8BE',
          '#FF6B6B',
          '#4ECDC4',
          '#FFD93D',
        ],
        spacing: 1,
      },
    ],
  };

  // Reference to the chart
  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  constructor(
    private translateService: TranslateService,
    private rentRequestsService: RentRequestsService,
    private propertyTypesService: PropertyTypesService
  ) {}

  ngOnInit(): void {
    // Initial setup
    this.updateChartData();
    this.updateLineChartData();

    // Subscribe to language changes
    this.translateService.onLangChange.subscribe(() => {
      this.translateMonthsAndUpdate();
      // Rebuild type names for donut when language toggles
      this.refreshTypeNamesForDonut();
    });

    // Initial translation
    this.translateMonthsAndUpdate();

    // Load data from API
    this.loadFromApi();
  }

  getRequestMax(): number {
    const data = this.currentData;
    return data.totalInsights;
  }

  calculateWidth(value: number, max: number): number {
    return (value / max) * 100;
  }

  onMonthChange(months: string): void {
    this.selectedMonths = months;
    this.updateLineChartData();
  }

  private updateLineChartData(): void {
    if (this.lineChartData?.datasets?.[0]) {
      const months = this.getLast12Months();
      const selectedMonthsNum = parseInt(this.selectedMonths);
      const filteredMonths = months.slice(-selectedMonthsNum);

      const startIndex = months.length - selectedMonthsNum;
      const data = this.monthlyCounts.slice(startIndex);

      this.lineChartData = {
        ...this.lineChartData,
        datasets: [
          {
            ...this.lineChartData.datasets[0],
            data: data,
          },
        ],
      };

      this.updateChart();
    }
  }

  private updateChartData(): void {
    if (this.donutChartData?.datasets?.[0]) {
      this.donutChartData = {
        ...this.donutChartData,
        datasets: [
          {
            ...this.donutChartData.datasets[0],
            data: this.donutCounts.length ? this.donutCounts : [0, 0, 0, 0, 0],
          },
        ],
      };
      if (this.donutLabels.length) {
        this.donutChartData.labels = [...this.donutLabels];
      }
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (this.chartDirective?.chart) {
      this.chartDirective.chart.update();
    }
  }

  private getLast12MonthsDateObjs(): {
    year: number;
    month: number;
    label: string;
  }[] {
    const months: { year: number; month: number; label: string }[] = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('default', { month: 'long' }),
      });
    }
    return months;
  }

  private loadFromApi(): void {
    // Load type map first
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (res) => {
        (res?.data || []).forEach((t: any) => {
          this.typeIdToName[t.id] =
            this.translateService.currentLang === 'ar' ? t.name_ar : t.name_en;
        });
      },
      error: () => {},
    });

    this.rentRequestsService.getRentRequests(1).subscribe({
      next: (res) => {
        const items = res?.data || [];
        // Monthly counts
        const months = this.getLast12MonthsDateObjs();
        const indexMap = new Map<string, number>();
        months.forEach((m, idx) => indexMap.set(`${m.year}-${m.month}`, idx));
        const counts = Array(12).fill(0);
        items.forEach((rr: any) => {
          const d = new Date(rr.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const idx = indexMap.get(key);
          if (idx !== undefined) counts[idx] += 1;
        });
        this.monthlyCounts = counts;
        this.updateLineChartData();

        // Donut: counts by property_type_id (top 5)
        const typeCount = new Map<number, number>();
        items.forEach((rr: any) => {
          const tid = rr?.property?.property_type_id;
          if (tid != null) typeCount.set(tid, (typeCount.get(tid) || 0) + 1);
        });
        const sorted = Array.from(typeCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        this.donutTypeIds = sorted.map(([id]) => id);
        this.donutLabels = sorted.map(
          ([id]) => this.typeIdToName[id] || String(id)
        );
        this.donutCounts = sorted.map(([, count]) => count);
        this.updateChartData();
      },
      error: () => {
        // keep zeros
      },
    });
  }

  private refreshTypeNamesForDonut(): void {
    // Reload type names and update donut labels without changing counts
    this.propertyTypesService.getPropertyTypes().subscribe({
      next: (res) => {
        const map: { [id: number]: string } = {};
        (res?.data || []).forEach((t: any) => {
          map[t.id] =
            this.translateService.currentLang === 'ar' ? t.name_ar : t.name_en;
        });
        this.typeIdToName = map;
        if (this.donutTypeIds.length) {
          this.donutLabels = this.donutTypeIds.map(
            (id) => this.typeIdToName[id] || String(id)
          );
          if (this.donutChartData) {
            this.donutChartData = {
              ...this.donutChartData,
              labels: [...this.donutLabels],
            };
            this.updateChart();
          }
        }
      },
      error: () => {},
    });
  }
}
