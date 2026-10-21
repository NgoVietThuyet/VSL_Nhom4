import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../../../ng-zorro.module';
import { SignalRService } from '../../../../services/signalr.service';
import { TaskDashboardService } from '../../../../../features/task-management/services/task-dashboard.service';

@Component({
  selector: 'app-priority-org-tv',
  templateUrl: './priority-org-tv.html',
  styleUrl: './priority-org-tv.scss',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModules],
})
export class PriorityOrgTv implements OnInit, AfterViewInit, OnDestroy {
  data: any[] = [];
  currentTime = '';
  currentDate = '';
  lastUpdated = '';
  isFullscreen = false;

  readonly SPECIAL_PRIORITY = 4;

  private clockTimer: any;
  private destroy$ = new Subject<void>();
  private readonly onFsChange = () => {
    this.isFullscreen = !!document.fullscreenElement;
  };

  constructor(
    private taskDashboardService: TaskDashboardService,
    private signalRService: SignalRService,
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    this.loadData();
    this.signalRService.dashboardUpdate$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadData();
    });
    document.addEventListener('fullscreenchange', this.onFsChange);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
    document.removeEventListener('fullscreenchange', this.onFsChange);
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  get specialCount(): number {
    return this.data.filter(t => t.priority === this.SPECIAL_PRIORITY).length;
  }

  getPriorityLabel(task: any): string {
    return task.priority === this.SPECIAL_PRIORITY ? 'Đặc biệt' : 'Theo dõi';
  }

  getPriorityColor(task: any): string {
    return task.priority === this.SPECIAL_PRIORITY ? '#dc2626' : '#9333ea';
  }

  getPriorityBg(task: any): string {
    return task.priority === this.SPECIAL_PRIORITY ? '#fee2e2' : '#fdf4ff';
  }

  private loadData(): void {
    this.taskDashboardService.priorityTasks().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = Array.isArray(res) ? res : [];
        this.lastUpdated = new Date().toLocaleTimeString('vi-VN');
      },
      error: () => {
        this.data = [];
      },
    });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.currentDate = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
