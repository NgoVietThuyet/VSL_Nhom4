import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from './services/dashboard.service';
import { AdminDashboardData } from '../../shared/models/dashboard.model';
import { SharedModules } from '../../shared/ng-zorro.module';
import { activityTypeLabel, initials } from '../../shared/labels';

Chart.register(...registerables);

/** Bảng màu biểu đồ: cùng tông với thẻ KPI, đủ khác nhau cả về độ sáng. */
const LEVEL_COLORS = ['#189AD6', '#16a34a', '#f59e0b', '#7c3aed', '#db2777', '#0891b2'];
const CHART_TEXT = '#4b5563';
const CHART_GRID = '#eef2f6';

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

  get totalTopicPractices(): number {
    return (this.data?.charts?.topicPractices || []).reduce((s, t) => s + (t.count || 0), 0);
  }

  get weeklyTotal(): number {
    return (this.data?.charts?.dailyActivities || [])
      .reduce((s, d) => s + (d.practiceCount || 0) + (d.quizCount || 0), 0);
  }

  /** Không vẽ một đường phẳng ở 0 — khi tuần trống thì hiện hướng dẫn thay biểu đồ. */
  get hasWeeklyActivity(): boolean {
    return this.weeklyTotal > 0;
  }

  readonly initials = initials;
  readonly activityTypeLabel = activityTypeLabel;

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
    if (!canvas || !days || !this.hasWeeklyActivity) return;

    this.activityChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: days.map(d => d.date),
        datasets: [
          {
            label: 'Luyện AI Camera',
            data: days.map(d => d.practiceCount),
            borderColor: '#189AD6',
            backgroundColor: 'rgba(24, 154, 214, 0.12)',
            pointBackgroundColor: '#189AD6',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
          {
            label: 'Bài Quiz',
            data: days.map(d => d.quizCount),
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            pointBackgroundColor: '#7c3aed',
            borderDash: [6, 4],
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
            labels: { font: { size: 12 }, color: CHART_TEXT, padding: 10, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 12 }, color: CHART_TEXT } },
          y: { beginAtZero: true, grid: { color: CHART_GRID }, ticks: { font: { size: 12 }, color: CHART_TEXT, precision: 0 } },
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
          backgroundColor: hasData ? levels.map((_, i) => LEVEL_COLORS[i % LEVEL_COLORS.length]) : ['#eef2f6'],
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
