import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexLegend, ApexTooltip, NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis; yaxis: ApexYAxis; grid: ApexGrid; dataLabels: ApexDataLabels;
  legend: ApexLegend; tooltip: ApexTooltip; colors: string[];
};

const ITEM_HEIGHT = 52;
const SCROLL_THRESHOLD = 5;
const MAX_HEIGHT = 300;

@Component({
  selector: 'app-tk-stacked-bar-chart',
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
      [legend]="chartOptions.legend!"
      [tooltip]="chartOptions.tooltip!"
      [colors]="chartOptions.colors!"
    ></apx-chart>
  </div>`,
  styles: [`:host { display: block; width: 100%; }
  .chart-wrap { overflow-y: auto; overflow-x: hidden; }`]
})
export class TkStackedBarChart implements OnChanges {
  @Input() dataChart: any[] = [];
  chartOptions: Partial<ChartOptions> = {};
  readonly scrollThreshold = SCROLL_THRESHOLD;
  readonly maxHeight = MAX_HEIGHT;

  ngOnChanges(): void {
    if (!this.dataChart?.length) return;
    const categories = this.dataChart.map((i: any) => i.label);
    const chartHeight = Math.max(240, this.dataChart.length * ITEM_HEIGHT + 40);

    this.chartOptions = {
      series: [
        { name: 'Hoàn thành', data: this.dataChart.map((i: any) => i.dataStatusDone) },
        { name: 'Đang thực hiện', data: this.dataChart.map((i: any) => i.dataStatusDoing) },
        { name: 'Quá hạn', data: this.dataChart.map((i: any) => i.dataStatusOverdue) },
      ],
      chart: { type: 'bar', stacked: true, height: chartHeight, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true, barHeight: '55%',
          borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last'
        }
      },
      colors: ['#15d167', '#ffc107', '#ef4444'],
      dataLabels: {
        enabled: true,
        style: { colors: ['#fff'], fontSize: '12px', fontWeight: 500 },
        formatter: (val: number) => val > 0 ? val.toString() : ''
      },
      xaxis: {
        categories,
        labels: { offsetX: 15, style: { colors: '#64748B', fontSize: '13px' } }
      },
      yaxis: {
        labels: { align: 'left', offsetX: -10, style: { colors: '#64748B', fontSize: '13px' } }
      },
      grid: {
        strokeDashArray: 4, borderColor: '#E2E8F0',
        xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } }
      },
      legend: { position: 'bottom' },
      tooltip: { theme: 'light' }
    };
  }
}
