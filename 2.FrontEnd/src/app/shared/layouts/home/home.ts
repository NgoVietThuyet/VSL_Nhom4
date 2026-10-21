import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { GlobalService } from '../../../core';
import { SharedModules } from '../../ng-zorro.module';
import { DashboardService } from '../../services/dashboard.service';
import { Chart, registerables } from 'chart.js';
import type {
  DashboardStats,
  DashboardTaskStatus,
  DashboardRecentTask,
  DashboardMeeting,
  DashboardEvent,
  DashboardMail,
  DashboardNote,
  DashboardDocument,
} from '../../services/dashboard.service';
import { LocalStorageUtils } from '../../utils';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [CommonModule, SharedModules],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('taskChartCanvas') taskChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyChartCanvas') weeklyChartCanvas!: ElementRef<HTMLCanvasElement>;

  private taskChart?: Chart;
  private weeklyChart?: Chart;
  private viewReady = false;
  private dataReady = false;

  userName = '';
  todayDay = '';
  todayWeekday = '';
  todayMonth = '';
  todayLabel = '';

  stats: DashboardStats = {
    tasks: 0, tasksDue: 0,
    meetings: 0, meetingsToday: 0,
    mails: 0, mailsUnread: 0,
    events: 0,
    notes: 0, notesRecent: 0,
    documents: 0,
    personals: 0, personalRecent: 0,
  };

  taskStatusList: DashboardTaskStatus[] = [];
  upcomingMeetings: DashboardMeeting[] = [];
  recentTasks: DashboardRecentTask[] = [];
  todayEvents: DashboardEvent[] = [];
  recentMails: DashboardMail[] = [];
  recentNotes: DashboardNote[] = [];
  recentDocuments: DashboardDocument[] = [];

  activeMailTab: 'mail' | 'notes' = 'mail';

  quickItems = [
    { route: ['/task'],              label: 'Công việc',   icon: 'kanban',            img: 'img/desktop/task.png',     color: '#52c41a', tooltip: 'Quản lý công việc'   },
    { route: ['/meeting'],           label: 'Cuộc họp',    icon: 'camera-video',      img: 'img/desktop/meeting.png',  color: '#189AD6', tooltip: 'Họp trực tuyến'       },
    { route: ['/calendar'],          label: 'Lịch',        icon: 'calendar-event',    img: 'img/desktop/calendar.png', color: '#fa8c16', tooltip: 'Lịch cá nhân'         },
    { route: ['/mail'],              label: 'Thư điện tử', icon: 'envelope',          img: 'img/desktop/email.png',    color: '#eb2f96', tooltip: 'Thư điện tử'          },
    { route: ['/notes'],             label: 'Ghi chú',     icon: 'journal-text',      img: 'img/desktop/notes.png',    color: '#722ed1', tooltip: 'Ghi chú cá nhân'      },
    { route: ['/chat'],              label: 'Tin nhắn',    icon: 'chat-dots',         img: 'img/desktop/chat.png',     color: '#13c2c2', tooltip: 'Nhắn tin nội bộ'      },
    { route: ['/explorer/personal'], label: 'Tài liệu',    icon: 'file-earmark-text', img: 'img/desktop/folder.png',   color: '#1890ff', tooltip: 'Quản lý tài liệu'     },
    { route: ['/explorer/archive'],  label: 'Kho lưu trữ', icon: 'folder',            img: 'img/desktop/database.png', color: '#fa541c', tooltip: 'Kho lưu trữ file'     },
    { route: ['/chat-bot'],          label: 'Trợ lý AI',   icon: 'robot',             img: 'img/desktop/robot.png',    color: '#f759ab', tooltip: 'Trợ lý AI'            },
  ];

  constructor(
    public global: GlobalService,
    private dashboard: DashboardService,
  ) { }

  ngOnInit(): void {
    this.initTodayInfo();
    this.loadUserInfo();
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) {
      this.scheduleCharts();
    }
  }

  ngOnDestroy(): void {
    this.taskChart?.destroy();
    this.weeklyChart?.destroy();
  }

  private scheduleCharts(): void {
    setTimeout(() => {
      this.initTaskChart();
      this.initWeeklyChart();
    }, 60);
  }

  private loadDashboard(): void {
    this.dashboard.getSummary().subscribe({
      next: (data) => {
        if (data) {
          this.stats = { ...this.stats, ...data.stats };
          this.taskStatusList = data.taskStatusList ?? [];
          this.recentTasks = data.recentTasks ?? [];
          this.upcomingMeetings = data.upcomingMeetings ?? [];
          this.todayEvents = data.todayEvents ?? [];
          this.recentMails = data.recentMails ?? [];
          this.recentNotes = data.recentNotes ?? [];
          this.recentDocuments = data.recentDocuments ?? [];
          this.dataReady = true;
          if (this.viewReady) {
            this.scheduleCharts();
          }
        }
      },
    });
  }

  // ── Task status doughnut ────────────────────────────────────────────────────
  private initTaskChart(): void {
    if (!this.taskChartCanvas?.nativeElement) return;
    this.taskChart?.destroy();

    const hasData = this.taskStatusList.length > 0 && this.taskStatusList.some(t => t.count > 0);
    const labels = hasData ? this.taskStatusList.map(t => t.label) : ['Chưa có dữ liệu'];
    const data = hasData ? this.taskStatusList.map(t => t.count) : [1];
    const colors = hasData ? this.taskStatusList.map(t => t.color) : ['#f0f0f0'];

    this.taskChart = new Chart(this.taskChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
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
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => (a as number) + (b as number), 0) as number;
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ── Weekly activity bar (meetings + tasks) ──────────────────────────────────
  private initWeeklyChart(): void {
    if (!this.weeklyChartCanvas?.nativeElement) return;
    this.weeklyChart?.destroy();

    const today = new Date();
    const dayAbbr = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const labels: string[] = [];
    const dateList: Date[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(dayAbbr[d.getDay()]);
      dateList.push(d);
    }

    // Count meetings per day (match by day+month extracted from date string)
    const meetingCounts = new Array(7).fill(0);
    for (const m of this.upcomingMeetings) {
      try {
        const parts = m.date.match(/\d+/g);
        if (parts && parts.length >= 2) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          for (let i = 0; i < 7; i++) {
            if (dateList[i].getDate() === day && dateList[i].getMonth() === month) {
              meetingCounts[i]++;
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // Spread total task count evenly across week (no real time-series data)
    const taskTotal = this.taskStatusList.reduce((s, t) => s + t.count, 0);
    const taskCounts = this.spreadAcrossWeek(taskTotal, 7);

    this.weeklyChart = new Chart(this.weeklyChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Công việc',
            data: taskCounts,
            borderColor: 'rgba(82, 196, 26, 0.9)',
            backgroundColor: 'rgba(82, 196, 26, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgba(82, 196, 26, 0.9)',
            borderWidth: 2,
          },
          {
            label: 'Cuộc họp',
            data: meetingCounts,
            borderColor: 'rgba(24, 154, 214, 0.9)',
            backgroundColor: 'rgba(24, 154, 214, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgba(24, 154, 214, 0.9)',
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
            labels: {
              font: { size: 11 },
              padding: 8,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#8c8c8c' },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f5f5f5' },
            ticks: {
              font: { size: 11 },
              color: '#8c8c8c',
              stepSize: 1,
              maxTicksLimit: 5,
            },
          },
        },
      },
    });
  }

  private spreadAcrossWeek(total: number, days: number): number[] {
    if (total === 0) return new Array(days).fill(0);
    const base = Math.floor(total / days);
    const result = new Array(days).fill(base);
    const remaining = total - base * days;
    const positions = [0, 2, 4, 1, 3, 5, 6];
    for (let i = 0; i < remaining && i < positions.length; i++) {
      result[positions[i]]++;
    }
    return result;
  }

  private initTodayInfo(): void {
    const now = new Date();
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];
    this.todayDay = now.getDate().toString();
    this.todayWeekday = weekdays[now.getDay()];
    this.todayMonth = `${months[now.getMonth()]}, ${now.getFullYear()}`;
    this.todayLabel = `${weekdays[now.getDay()]}, ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  }

  private loadUserInfo(): void {
    try {
      const raw = LocalStorageUtils.getItem('accountInfo');
      if (raw) {
        const account = raw;
        if (account?.fullName) this.userName = account.fullName;
        else if (account?.userName) this.userName = account.userName;
      }
    } catch { }
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  getDocImg(type: string): string {
    const t = (type || '').toUpperCase().replace('.', '');
    const map: Record<string, string> = {
      'PDF':  'img/pdf.png',
      'DOC':  'img/word.png',
      'DOCX': 'img/word.png',
      'XLS':  'img/excel.png',
      'XLSX': 'img/excel.png',
      'PPT':  'img/powerpoint.png',
      'PPTX': 'img/powerpoint.png',
      'PNG':  'img/image.png',
      'JPG':  'img/image.png',
      'JPEG': 'img/image.png',
      'GIF':  'img/image.png',
      'SVG':  'img/image.png',
      'MP3':  'img/audio.png',
      'WAV':  'img/audio.png',
      'AAC':  'img/audio.png',
      'MP4':  'img/multimedia.png',
      'AVI':  'img/multimedia.png',
      'MOV':  'img/multimedia.png',
      'MKV':  'img/multimedia.png',
    };
    return map[t] || 'img/file.png';
  }

  getPercent(value: number): number {
    const total = this.taskStatusList.reduce((s, t) => s + t.count, 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  refresh(): void {
    this.taskChart?.destroy();
    this.weeklyChart?.destroy();
    this.taskChart = undefined;
    this.weeklyChart = undefined;
    this.dataReady = false;
    this.loadDashboard();
  }
}
