import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexTooltip, NgApexchartsModule
} from 'ng-apexcharts';

type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis; yaxis: ApexYAxis; grid: ApexGrid;
  dataLabels: ApexDataLabels; tooltip: ApexTooltip; colors: string[];
};

const ITEM_HEIGHT = 36;
const SCROLL_THRESHOLD = 5;
const MAX_HEIGHT = 300;

@Component({
  selector: 'app-tk-by-field-chart',
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
export class TkByFieldChart implements OnChanges {
  @Input() dataChart: { fieldName: string; count: number }[] = [];
  chartOptions: Partial<ChartOptions> = {};
  readonly scrollThreshold = SCROLL_THRESHOLD;
  readonly maxHeight = MAX_HEIGHT;

  ngOnChanges(): void {
    if (!this.dataChart?.length) return;
    const categories = this.dataChart.map(i => i.fieldName);
    const data = this.dataChart.map(i => i.count);
    const chartHeight = Math.max(220, this.dataChart.length * ITEM_HEIGHT + 40);

    this.chartOptions = {
      series: [{ name: 'Số nhiệm vụ', data }],
      chart: { type: 'bar', height: chartHeight, toolbar: { show: false }, parentHeightOffset: 0 },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadiusApplication: 'end' } },
      colors: ['#8b5cf6'],
      dataLabels: {
        enabled: true, textAnchor: 'start', offsetX: 0,
        style: { colors: ['#fff'], fontSize: '13px', fontWeight: 600 },
        formatter: (val: number) => val.toString()
      },
      xaxis: {
        categories,
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { style: { colors: '#64748B', fontSize: '13px' } }
      },
      yaxis: {
        labels: {
          align: 'left', offsetX: -10,
          style: { colors: '#64748B', fontSize: '12px' },
          formatter: (val: number | string): string => {
            const s = String(val);
            return s.length > 20 ? s.substring(0, 20) + '…' : s;
          }
        }
      },
      grid: {
        borderColor: '#D3D7DB', strokeDashArray: 4, position: 'back',
        xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } }
      },
      tooltip: { theme: 'light' }
    };
  }
}
