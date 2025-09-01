import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
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
export class AgentdashboardchartsComponent implements OnInit, OnChanges {
  @Input() rentRequests: any[] = [];

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

    console.log(
      'Current Total Property Insights:',
      total,
      'for',
      this.selectedMonths,
      'months'
    );
    return { months: '', totalInsights: total };
  }

  public donutChartData: ChartConfiguration['data'] = {
    labels: this.translatedLabels,
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

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    // Initial setup
    this.updateChartData();
    this.updateLineChartData();

    // Subscribe to language changes
    this.translateService.onLangChange.subscribe(() => {
      this.translateMonthsAndUpdate();
      // Retranslate property types when language changes
      if (this.rentRequests && this.rentRequests.length > 0) {
        this.retranslatePropertyTypes();
      }
    });

    // Initial translation
    this.translateMonthsAndUpdate();

    // Load static data instead of API calls
    this.loadStaticData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rentRequests'] && changes['rentRequests'].currentValue) {
      console.log('Rent requests input changed, reprocessing data...');
      this.loadStaticData(); // This will now use the new rent requests data
    }
  }

  getRequestMax(): number {
    const data = this.currentData;
    const max = data.totalInsights;
    console.log('Request Max (Total Property Insights):', max);
    return max;
  }

  getTotalInsights(): number {
    const total = this.monthlyCounts.reduce((a, b) => a + b, 0);
    console.log('Total Property Insights across all months:', total);
    return total;
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

  private loadStaticData(): void {
    console.log('loadStaticData called with rentRequests:', this.rentRequests);

    if (this.rentRequests && this.rentRequests.length > 0) {
      console.log(
        'Using real rent requests data, length:',
        this.rentRequests.length
      );
      // Use real data from rent requests
      this.processRentRequestsData();
    } else {
      console.log('No rent requests data available');
      // Initialize with empty data when no rent requests are available
      this.monthlyCounts = Array(12).fill(0);
      this.updateLineChartData();

      this.donutLabels = [];
      this.donutCounts = [];
      this.updateChartData();
    }
  }

  private processRentRequestsData(): void {
    console.log('Processing rent requests data:', this.rentRequests);

    // Process monthly data from rent requests for Total Property Insights
    const months = this.getLast12MonthsDateObjs();
    const indexMap = new Map<string, number>();
    months.forEach((m, idx) => indexMap.set(`${m.year}-${m.month}`, idx));
    const counts = Array(12).fill(0);

    this.rentRequests.forEach((rr: any) => {
      const d = new Date(rr.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = indexMap.get(key);
      if (idx !== undefined) counts[idx] += 1;
    });

    console.log('Monthly counts for Total Property Insights:', counts);
    this.monthlyCounts = counts;
    this.updateLineChartData();

    // Process property type data for donut chart
    const typeCount = new Map<string, number>();
    this.rentRequests.forEach((rr: any) => {
      const propertyType = rr?.property?.type?.name_en;
      if (propertyType) {
        typeCount.set(propertyType, (typeCount.get(propertyType) || 0) + 1);
      }
    });

    const sorted = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log('Property type distribution:', sorted);

    // Translate property type names based on current language
    this.translatePropertyTypes(sorted);

    this.updateChartData();

    // Force chart updates to ensure UI reflects the new data
    setTimeout(() => {
      this.updateChart();
    }, 100);
  }

  private translatePropertyTypes(sortedTypes: [string, number][]): void {
    const currentLang = this.translateService.currentLang || 'en';
    const translatedLabels: string[] = [];

    sortedTypes.forEach(([type, count]) => {
      if (currentLang === 'ar') {
        // Get Arabic name from the original data
        const rentRequest = this.rentRequests.find(
          (rr) => rr?.property?.type?.name_en === type
        );
        const arabicName = rentRequest?.property?.type?.name_ar || type;
        translatedLabels.push(arabicName);
      } else {
        // Use English name
        translatedLabels.push(type);
      }
    });

    this.donutLabels = translatedLabels;
    this.donutCounts = sortedTypes.map(([, count]) => count);

    console.log('Translated property types:', {
      original: sortedTypes.map(([type]) => type),
      translated: translatedLabels,
      language: currentLang,
    });
  }

  private retranslatePropertyTypes(): void {
    // Recreate the type count map and retranslate
    const typeCount = new Map<string, number>();
    this.rentRequests.forEach((rr: any) => {
      const propertyType = rr?.property?.type?.name_en;
      if (propertyType) {
        typeCount.set(propertyType, (typeCount.get(propertyType) || 0) + 1);
      }
    });

    const sorted = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.translatePropertyTypes(sorted);
    this.updateChartData();
  }

  private refreshTypeNamesForDonut(): void {
    // No longer needed since we're using static data
    // This method is kept for compatibility but does nothing
  }
}
