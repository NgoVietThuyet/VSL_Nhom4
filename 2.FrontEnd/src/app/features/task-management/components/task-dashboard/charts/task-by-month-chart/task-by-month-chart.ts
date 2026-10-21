import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { readCssSystemPrimary } from '../../../../../../core/utils/theme-tokens';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexTooltip, NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-tk-by-month-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `<div class="chart-wrapper" *ngIf="chartOptions?.series">
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
  styles: [`.chart-wrapper { overflow-x: auto; }`]
})
export class TkByMonthChart implements OnChanges {
  @Input() dataChart: any[] = [];
  chartOptions: Partial<ChartOptions> = {};

  ngOnChanges(): void {
    const categories = this.dataChart.map(i => i.monthLabel ?? `T${i.month}`);
    const data = this.dataChart.map(i => i.count ?? 0);
    const chartHeight = Math.max(250, this.dataChart.length * 50);

    this.chartOptions = {
      series: [{ name: 'Số nhiệm vụ', data }],
      chart: { type: 'bar', height: chartHeight, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadiusApplication: 'end' } },
      colors: [readCssSystemPrimary()],
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
        labels: { align: 'left', offsetX: -10, style: { colors: '#64748B', fontSize: '14px' } }
      },
      grid: {
        borderColor: '#D3D7DB', strokeDashArray: 4, position: 'back',
        xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } }
      },
      tooltip: { theme: 'light' }
    };
  }
}
