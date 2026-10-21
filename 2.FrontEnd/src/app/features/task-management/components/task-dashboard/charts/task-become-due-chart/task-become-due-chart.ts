import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import {
  ApexAxisChartSeries, ApexChart, ApexPlotOptions, ApexXAxis,
  ApexYAxis, ApexGrid, ApexDataLabels, ApexTooltip, ApexLegend, NgApexchartsModule
} from 'ng-apexcharts';

type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis; yaxis: ApexYAxis; grid: ApexGrid; dataLabels: ApexDataLabels;
  tooltip: ApexTooltip; colors: string[]; legend: ApexLegend;
};

@Component({
  selector: 'app-tk-become-due-chart',
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
      [legend]="chartOptions.legend!"
    ></apx-chart>
  </div>`
})
export class TkBecomeDueChart implements OnChanges {
  @Input() dataChart: { from1To10: number; from11To20: number; from21: number } = { from1To10: 0, from11To20: 0, from21: 0 };
  /** Emits '1-10' | '11-20' | '21+' khi click vào cột biểu đồ */
  @Output() barClick = new EventEmitter<string>();

  private readonly RANGE_MAP = ['1-10', '11-20', '21+'];

  chartOptions: Partial<ChartOptions> = {};

  ngOnChanges(): void {
    this.chartOptions = {
      series: [{ name: 'Số nhiệm vụ', data: [this.dataChart.from1To10, this.dataChart.from11To20, this.dataChart.from21] }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        events: {
          dataPointSelection: (_event: any, _ctx: any, config: any) => {
            const range = this.RANGE_MAP[config.dataPointIndex ?? 0] ?? '1-10';
            this.barClick.emit(range);
          },
        },
      },
      plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadiusApplication: 'end' } },
      colors: ['#f59e0b'],
      dataLabels: {
        enabled: true, textAnchor: 'start', offsetX: 0,
        style: { colors: ['#fff'], fontSize: '13px', fontWeight: 600 },
        formatter: (val: number) => val.toString()
      },
      xaxis: {
        categories: ['01-<10 ngày', '10-<20 ngày', '20+ ngày'],
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { style: { colors: '#64748B', fontSize: '13px' } }
      },
      yaxis: {
        labels: { align: 'left', offsetX: -10, style: { colors: '#64748B', fontSize: '14px' } }
      },
      legend: { position: 'bottom', fontSize: '14px' },
      grid: {
        borderColor: '#D3D7DB', strokeDashArray: 4, position: 'back',
        xaxis: { lines: { show: true } }, yaxis: { lines: { show: true } }
      },
      tooltip: { theme: 'light' }
    };
  }
}
