import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { readCssSystemPrimary } from '../../../../../../core/utils/theme-tokens';
import {
  ApexNonAxisChartSeries, ApexChart, ApexDataLabels, ApexLegend,
  ApexTooltip, ApexStroke, ApexPlotOptions, ApexResponsive, NgApexchartsModule
} from 'ng-apexcharts';

type PieChartOptions = {
  series: ApexNonAxisChartSeries; chart: ApexChart; labels: string[];
  colors: string[]; dataLabels: ApexDataLabels; legend: ApexLegend;
  tooltip: ApexTooltip; stroke: ApexStroke; plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
};

@Component({
  selector: 'app-tk-update-rate-pie-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  styles: [`:host { display: block; height: 100%; } apx-chart { display: block; height: 100%; }`],
  template: `<apx-chart
    [series]="chartOptions.series!"
    [chart]="chartOptions.chart!"
    [labels]="chartOptions.labels!"
    [colors]="chartOptions.colors!"
    [dataLabels]="chartOptions.dataLabels!"
    [legend]="chartOptions.legend!"
    [tooltip]="chartOptions.tooltip!"
    [stroke]="chartOptions.stroke!"
    [plotOptions]="chartOptions.plotOptions!"
    [responsive]="chartOptions.responsive!"
  ></apx-chart>`
})
export class TkUpdateRatePieChart implements OnChanges {
  @Input() completed: number = 0;
  @Input() notDoneInTime: number = 0;
  @Input() overdue: number = 0;
  /** Emits 'done' | 'intime' | 'overdue' khi người dùng click vào vùng biểu đồ */
  @Output() segmentClick = new EventEmitter<string>();

  private readonly STATUS_MAP = ['done', 'intime', 'overdue'];

  chartOptions: PieChartOptions = this.buildOptions(0, 0, 0);

  ngOnChanges(): void {
    this.chartOptions = this.buildOptions(this.completed, this.notDoneInTime, this.overdue);
  }

  private buildOptions(completed: number, notDoneInTime: number, overdue: number): PieChartOptions {
    const nonZero = [completed, notDoneInTime, overdue].filter(v => v > 0).length;
    return {
      series: [completed, notDoneInTime, overdue],
      chart: {
        type: 'pie',
        height: '100%',
        toolbar: { show: false },
        animations: { enabled: false },
        events: {
          dataPointSelection: (_event: any, _ctx: any, config: any) => {
            const status = this.STATUS_MAP[config.dataPointIndex ?? 0] ?? 'done';
            this.segmentClick.emit(status);
          },
        },
      },
      labels: ['Hoàn thành', 'Chưa HT trong hạn', 'Chưa HT quá hạn'],
      colors: ['#22c55e', readCssSystemPrimary(), '#ef4444'],
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', fontWeight: '600' },
        formatter: (val: number, opts?: any) => {
          const idx = opts?.seriesIndex ?? 0;
          const count = opts?.w?.config?.series?.[idx] ?? 0;
          const total = (opts?.w?.globals?.seriesTotals as number[] ?? []).reduce((a: number, b: number) => a + b, 0);
          return `${Math.round(val)}% (${count}/${total})`;
        },
        dropShadow: { enabled: false }
      },
      plotOptions: {
        pie: { dataLabels: { offset: -15, minAngleToShowLabel: 8 } }
      },
      legend: { position: 'bottom', fontSize: '13px' },
      tooltip: { y: { formatter: (v: number) => `${v} nhiệm vụ` } },
      stroke: { show: nonZero > 1, width: 1, colors: ['#fff'] },
      responsive: [],
    };
  }
}
