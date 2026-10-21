import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexTooltip, NgApexchartsModule
} from 'ng-apexcharts';

type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis; yaxis: ApexYAxis; grid: ApexGrid;
  dataLabels: ApexDataLabels; tooltip: ApexTooltip; colors: string[];
};

@Component({
  selector: 'app-tk-extend-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `<div *ngIf="chartOptions?.series">
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
  </div>`
})
export class TkExtendChart implements OnChanges {
  @Input() dataChart: { done: number; doing: number; overdue: number } = { done: 0, doing: 0, overdue: 0 };
  chartOptions: Partial<ChartOptions> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataChart'] && this.dataChart) {
      this.chartOptions = {
        series: [{ name: 'Số nhiệm vụ', data: [this.dataChart.done, this.dataChart.doing, this.dataChart.overdue] }],
        chart: { type: 'bar', height: 280, toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadiusApplication: 'end' } },
        colors: ['#0891b2'],
        dataLabels: {
          enabled: true, textAnchor: 'start', offsetX: 8,
          style: { colors: ['#fff'], fontSize: '13px', fontWeight: 600 },
          formatter: (val: number) => val.toString()
        },
        xaxis: {
          categories: ['Hoàn thành', 'Đang thực hiện', 'Quá hạn'],
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
}
