import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedModules } from '../../../../ng-zorro.module';
import { SignalRService } from '../../../../services/signalr.service';
import { TaskDashboardService } from '../../../../../features/task-management/services/task-dashboard.service';
import { DashboardFilterDto } from '../../../../../features/task-management/models';

@Component({
  selector: 'app-overdue-org-tv',
  templateUrl: './overdue-org-tv.html',
  styleUrl: './overdue-org-tv.scss',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModules],
})
export class OverdueOrgTv implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scrollBody', { static: false }) scrollBody!: ElementRef<HTMLDivElement>;

  data: any[] = [];
  currentTime = '';
  currentDate = '';
  lastUpdated = '';
  isFullscreen = false;

  private clockTimer: any;
  private scrollTimer: any;
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
    clearInterval(this.scrollTimer);
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

  get overdueCount(): number {
    return this.data.filter(o => (o.overdue ?? 0) > 0).length;
  }

  private loadData(): void {
    this.taskDashboardService.byOrg(new DashboardFilterDto()).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const orgList: any[] = Array.isArray(res) ? res : [];
        this.data = orgList.filter((o: any) => !this.isRootOrg(o.organizationId)).map((o: any) => ({
          orgId: o.organizationId,
          orgName: o.organizationName ?? o.organizationId,
          orgLevel: o.orgLevel ?? 0,
          total: o.total ?? 0,
          onTime: o.onTime ?? Math.max(0, (o.total ?? 0) - (o.overdue ?? 0) - (o.dueSoon ?? 0)),
          overdue: o.overdue ?? 0,
          dueSoon: o.dueSoon ?? 0,
        }));
        this.lastUpdated = new Date().toLocaleTimeString('vi-VN');
        // setTimeout(() => this.startAutoScroll(), 300);
      },
      error: () => {
        this.data = [];
      },
    });
  }

  private startAutoScroll(): void {
    clearInterval(this.scrollTimer);
    const el = this.scrollBody?.nativeElement;
    if (!el) return;

    this.scrollTimer = setInterval(() => {
      if (el.scrollTop >= el.scrollHeight - el.clientHeight - 1) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    }, 40);
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

  private isRootOrg(orgId: string): boolean {
    if (!orgId) return false;
    // Root org G17 has no dot — children are G17.xx, G17.xx.xx
    return !orgId.includes('.');
  }

  getOverdueOrgColor(index: number): string {
    if (index === 0) return '#dc2626';
    if (index === 1) return '#f97316';
    if (index === 2) return '#eab308';
    return '#000000';
  }
}
