import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from './services/dashboard.service';
import { AdminDashboardData } from '../../shared/models/dashboard.model';
import { SharedModules } from '../../shared/ng-zorro.module';

Chart.register(...registerables);

const LEVEL_COLORS = ['#189AD6', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('activityChartCanvas') activityChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('levelChartCanvas') levelChartCanvas?: ElementRef<HTMLCanvasElement>;

  loading = true;
  error: string | null = null;
  data: AdminDashboardData | null = null;
  readonly levelColors = LEVEL_COLORS;
  readonly todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  private activityChart?: Chart;
  private levelChart?: Chart;

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        // Render ngay để canvas có trong DOM rồi mới vẽ biểu đồ
        this.cdr.detectChanges();
        this.renderCharts();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu dashboard:', err);
        this.error = 'Không thể kết nối đến máy chủ Backend (Port 5228). Vui lòng đảm bảo Spring Boot đang chạy.';
        this.loading = false;
      }
    });
  }

  get maxTopicCount(): number {
    const counts = this.data?.charts?.topicPractices?.map(t => t.count) || [];
    return Math.max(1, ...counts);
  }

  get totalLevelUsers(): number {
    return (this.data?.charts?.levelDistribution || []).reduce((s, l) => s + l.userCount, 0);
  }

  initials(name?: string): string {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  activityColor(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'SUCCESS': return 'green';
      case 'WARNING': return 'orange';
      default: return 'blue';
    }
  }

  private destroyCharts(): void {
    this.activityChart?.destroy();
    this.levelChart?.destroy();
    this.activityChart = undefined;
    this.levelChart = undefined;
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.initActivityChart();
    this.initLevelChart();
  }

  private initActivityChart(): void {
    const canvas = this.activityChartCanvas?.nativeElement;
    const days = this.data?.charts?.dailyActivities;
    if (!canvas || !days) return;

    this.activityChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: days.map(d => d.date),
        datasets: [
          {
            label: 'Luyện AI Camera',
            data: days.map(d => d.practiceCount),
            borderColor: 'rgba(24, 154, 214, 0.9)',
            backgroundColor: 'rgba(24, 154, 214, 0.1)',
            pointBackgroundColor: 'rgba(24, 154, 214, 0.9)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
          {
            label: 'Bài Quiz',
            data: days.map(d => d.quizCount),
            borderColor: 'rgba(114, 46, 209, 0.9)',
            backgroundColor: 'rgba(114, 46, 209, 0.08)',
            pointBackgroundColor: 'rgba(114, 46, 209, 0.9)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { font: { size: 11 }, padding: 8, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 }, precision: 0 } },
        },
      },
    });
  }

  private initLevelChart(): void {
    const canvas = this.levelChartCanvas?.nativeElement;
    const levels = this.data?.charts?.levelDistribution;
    if (!canvas || !levels) return;

    const hasData = levels.some(l => l.userCount > 0);

    this.levelChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: hasData ? levels.map(l => l.levelName) : ['Chưa có dữ liệu'],
        datasets: [{
          data: hasData ? levels.map(l => l.userCount) : [1],
          backgroundColor: hasData ? levels.map((_, i) => LEVEL_COLORS[i % LEVEL_COLORS.length]) : ['#f0f0f0'],
          borderWidth: hasData ? 2 : 0,
          borderColor: '#ffffff',
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: hasData },
        },
      },
    });
  }
}
