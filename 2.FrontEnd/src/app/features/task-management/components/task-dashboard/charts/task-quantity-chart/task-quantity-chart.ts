import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { readCssSystemPrimary } from '../../../../../../core/utils/theme-tokens';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexTooltip, NgApexchartsModule
} from 'ng-apexcharts';

type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis; yaxis: ApexYAxis; grid: ApexGrid;
  dataLabels: ApexDataLabels; tooltip: ApexTooltip; colors: string[];
};

const ITEM_HEIGHT = 52;
const SCROLL_THRESHOLD = 5;
const MAX_HEIGHT = 300;

@Component({
  selector: 'app-tk-quantity-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `<div class="chart-wrap"
    [style.max-height]="dataChart.length > scrollThreshold ? maxHeight + 'px' : 'none'"
    [style.overflow-y]="dataChart.length > scrollThreshold ? 'auto' : 'hidden'"
    *ngIf="chartOptions?.series">
    <apx-chart
      [series]="chartOptions.series!"
      [chart]="chartOptions.chart!"
      [plotOptions]="chartOptions.plotOptions!"
      [xaxis]="chartOptions.xaxis!"
      [yaxis]="chartOptions.yaxis!"
      [grid]="chartOptions.grid!"
      [dataLabels]="chartOptions.dataLabels!"
      [tooltip]="chartOptions.tooltip!"
      [colors]="chartOptions.colors!"
    ></apx-chart>
  </div>`,
  styles: [`:host { display: block; width: 100%; }
  .chart-wrap { overflow-y: auto; overflow-x: hidden; }`]
})
export class TkQuantityChart implements OnChanges {
  @Input() dataChart: any[] = [];
  chartOptions: Partial<ChartOptions> = {};
  readonly scrollThreshold = SCROLL_THRESHOLD;
  readonly maxHeight = MAX_HEIGHT;

  ngOnChanges(): void {
    if (!this.dataChart?.length) return;
    const orgNames = this.dataChart.map((i: any) => i.orgName);
    const totalTask = this.dataChart.map((i: any) => i.totalTask);
    const chartHeight = Math.max(240, this.dataChart.length * ITEM_HEIGHT + 40);

    this.chartOptions = {
      series: [{ name: 'Khối lượng', data: totalTask }],
      chart: { type: 'bar', height: chartHeight, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadiusApplication: 'end' } },
      colors: [readCssSystemPrimary()],
      dataLabels: {
        enabled: true, textAnchor: 'start',
        style: { colors: ['#fff'], fontSize: '13px', fontWeight: 600 },
        formatter: (val: number) => val.toString()
      },
      xaxis: {
        categories: orgNames,
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { offsetX: 15, style: { colors: '#64748B', fontSize: '13px' } }
      },
      yaxis: {
        labels: { align: 'left', offsetX: -10, style: { colors: '#64748B', fontSize: '13px' } }
      },
      grid: {
        borderColor: '#D3D7DB', strokeDashArray: 4, position: 'back',
        xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } }
      },
      tooltip: { theme: 'light' }
    };
  }
}
