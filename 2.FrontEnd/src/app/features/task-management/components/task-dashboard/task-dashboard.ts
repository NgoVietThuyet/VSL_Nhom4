import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { GlobalService } from '../../../../core/services/global.service';
import { SignalRService } from '../../../../shared/services/signalr.service';
import { TaskDashboardService } from '../../services/task-dashboard.service';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { DashboardFilterDto, TaskByOrgDto } from '../../models';
import { TkByFieldChart } from './charts/task-by-field-chart/task-by-field-chart';
import { TkStackedBarChart } from './charts/task-stacked-bar-chart/task-stacked-bar-chart';
import { TkQuantityChart } from './charts/task-quantity-chart/task-quantity-chart';
import { TkUpdateRatePieChart } from './charts/task-update-rate-pie-chart/task-update-rate-pie-chart';
import { TkBecomeDueChart } from './charts/task-become-due-chart/task-become-due-chart';
import { TkOverdateChart } from './charts/task-overdate-chart/task-overdate-chart';
import { TkExtendChart } from './charts/task-extend-chart/task-extend-chart';
import { Lunar } from 'lunar-javascript';
import { LocalStorageUtils } from '../../../../shared/utils';

export type FilterTime = 'all' | 'week' | 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [
    SharedModules,
    TkByFieldChart,
    TkStackedBarChart,
    TkQuantityChart,
    TkUpdateRatePieChart,
    TkBecomeDueChart,
    TkOverdateChart,
    TkExtendChart,
  ],
  templateUrl: './task-dashboard.html',
  styleUrl: './task-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userName = '';
  todayLabel = '';
  lunarDate = '';

  selectedTime: FilterTime = 'all';
  selectedYear: number | null = null;
  selectedOrgProgress: string | null = null;
  selectedOrgQuantity: string | null = null;
  selectedOrgRanking: string | null = null;

  organizeList: any[] = [];

  totalTasks = 0;
  notStarted = 0;
  inProgress = 0;
  completed = 0;
  overdue = 0;
  paused = 0;
  stopped = 0;
  pendingTotal = 0;

  dataChartByField: { fieldName: string; count: number }[] = [];
  originalDataProgressFollowOrg: any[] = [];
  dataProgressFollowOrg: any[] = [];
  originalDataChartQuantity: any[] = [];
  dataChartQuantity: any[] = [];
  originalDataChartRanking: any[] = [];
  dataChartRanking: any[] = [];
  taskToBecomeDueTask = { from1To10: 0, from11To20: 0, from21: 0 };
  dataListOverdueTasks = { overdue1To10: 0, overdue11To20: 0, overdue21: 0 };
  dataListExtendedTasks = { done: 0, doing: 0, overdue: 0 };

  dataListTasksDueSoon: any[] = [];
  dataListPriorityTasks: any[] = [];

  loading = false;

  constructor(
    private global: GlobalService,
    private dashboardService: TaskDashboardService,
    private organizeService: OrganizeService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Dashboard', path: 'task-management/dashboard' },
    ]);
  }

  ngOnInit(): void {
    this.initTodayInfo();
    this.loadUserInfo();
    this.loadData();

    this.signalRService.dashboardUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  onSelectTime(type: FilterTime): void {
    this.selectedTime = type;
    this.selectedYear = type === 'all' ? null : new Date().getFullYear();
    this.resetOrgFilters();
    this.loadData();
  }

  private initTodayInfo(): void {
    const now = new Date();
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    this.todayLabel = `${weekdays[now.getDay()]}, ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    this.lunarDate = this.getLunarText();
  }

  private loadUserInfo(): void {
    try {
      const account = LocalStorageUtils.getItem('accountInfo');
      if (account?.fullName) this.userName = account.fullName;
      else if (account?.userName) this.userName = account.userName;
    } catch { /* ignore */ }
  }

  private resetOrgFilters(): void {
    this.selectedOrgProgress = null;
    this.selectedOrgQuantity = null;
    this.selectedOrgRanking = null;
  }

  onOrgChangeProgress(orgId: string | null): void {
    this.dataProgressFollowOrg = orgId
      ? this.originalDataProgressFollowOrg.filter(x => x.id === orgId)
      : this.originalDataProgressFollowOrg;
  }

  onOrgChangeQuantity(orgId: string | null): void {
    this.dataChartQuantity = orgId
      ? this.originalDataChartQuantity.filter(x => x.orgId === orgId)
      : this.originalDataChartQuantity;
  }

  onOrgChangeRanking(orgId: string | null): void {
    this.dataChartRanking = orgId
      ? this.originalDataChartRanking.filter(x => x.orgId === orgId)
      : this.originalDataChartRanking;
  }

  private loadData(): void {
    this.loading = true;
    const filter = new DashboardFilterDto();
    filter.year = this.selectedYear;

    combineLatest([
      this.dashboardService.summary(filter),
      this.organizeService.search({ pageSize: 9999, isActive: true } as any),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([summaryRes, orgsRes]: [any, any]) => {
          const s = summaryRes ?? {};
          const orgs: any[] = Array.isArray(orgsRes?.data) ? orgsRes.data : (Array.isArray(orgsRes) ? orgsRes : []);
          this.organizeList = [...orgs].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'vi'));

          const ts = s.taskStatusSummary ?? {};
          this.totalTasks = s.totalTasks ?? 0;
          this.notStarted = ts.notStarted ?? 0;
          this.inProgress = ts.inProgress ?? 0;
          this.completed = ts.completed ?? 0;
          this.overdue = ts.overdue ?? 0;
          this.paused = ts.paused ?? 0;
          this.stopped = ts.stopped ?? 0;
          this.pendingTotal = (ts.pendingComplete ?? 0) + (ts.pendingExtend ?? 0) + (ts.pendingPause ?? 0) + (ts.pendingStop ?? 0);

          const tasksByField: any[] = Array.isArray(s.tasksByField) ? s.tasksByField : [];
          this.dataChartByField = tasksByField
            .filter(f => f.count > 0)
            .map(f => ({ fieldName: f.fieldName ?? f.fieldId, count: f.count }))
            .sort((a, b) => b.count - a.count);

          const orgMap = new Map<string, string>();
          orgs.forEach(o => orgMap.set(o.id, o.name));

          const tasksByOrg: any[] = Array.isArray(s.tasksByOrg) ? s.tasksByOrg : [];

          this.originalDataProgressFollowOrg = this.buildProgressByOrg(tasksByOrg, orgMap);
          this.dataProgressFollowOrg = this.originalDataProgressFollowOrg;

          this.originalDataChartQuantity = this.buildQuantityByOrg(tasksByOrg, orgMap);
          this.dataChartQuantity = this.originalDataChartQuantity;

          this.originalDataChartRanking = this.buildRanking(tasksByOrg, orgMap);
          this.dataChartRanking = this.originalDataChartRanking;

          const upcomingTasks: any[] = Array.isArray(s.upcomingTasks) ? s.upcomingTasks : [];
          const overdueTaskList: any[] = Array.isArray(s.overdueTaskList) ? s.overdueTaskList : [];

          this.dataListTasksDueSoon = upcomingTasks;
          this.dataListPriorityTasks = Array.isArray(s.priorityTasks) ? s.priorityTasks : [];
          this.taskToBecomeDueTask = this.calcBecomeDue(upcomingTasks);
          this.dataListOverdueTasks = this.calcOverdueBuckets(overdueTaskList);
          this.dataListExtendedTasks = {
            done: ts.completed ?? 0,
            doing: ts.inProgress ?? 0,
            overdue: ts.overdue ?? 0,
          };

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private buildProgressByOrg(tasksByOrg: TaskByOrgDto[], orgMap: Map<string, string>): any[] {
    return tasksByOrg
      .filter(o => o.total > 0)
      .map(o => ({
        id: o.organizationId,
        label: orgMap.get(o.organizationId) ?? o.organizationName ?? o.organizationId,
        dataStatusDone: o.completed,
        dataStatusDoing: Math.max(0, o.total - o.completed - o.overdue),
        dataStatusOverdue: o.overdue,
      }))
      .sort((a, b) => (b.dataStatusDone + b.dataStatusDoing + b.dataStatusOverdue) - (a.dataStatusDone + a.dataStatusDoing + a.dataStatusOverdue));
  }

  private buildQuantityByOrg(tasksByOrg: TaskByOrgDto[], orgMap: Map<string, string>): any[] {
    return tasksByOrg
      .filter(o => o.total > 0)
      .map(o => ({
        orgId: o.organizationId,
        orgName: orgMap.get(o.organizationId) ?? o.organizationName ?? o.organizationId,
        totalTask: o.total,
      }))
      .sort((a, b) => b.totalTask - a.totalTask);
  }

  private buildRanking(tasksByOrg: TaskByOrgDto[], orgMap: Map<string, string>): any[] {
    return tasksByOrg
      .filter(o => o.total > 0)
      .map(o => ({
        orgId: o.organizationId,
        orgName: orgMap.get(o.organizationId) ?? o.organizationName ?? o.organizationId,
        data: Math.round((o.completed / o.total) * 100),
      }))
      .sort((a, b) => b.data - a.data);
  }

  private calcBecomeDue(tasks: any[]): { from1To10: number; from11To20: number; from21: number } {
    const result = { from1To10: 0, from11To20: 0, from21: 0 };
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const days = this.daysRemaining(t.dueDate);
      if (days >= 1 && days <= 10) result.from1To10++;
      else if (days >= 11 && days <= 20) result.from11To20++;
      else if (days >= 21) result.from21++;
    });
    return result;
  }

  private calcOverdueBuckets(tasks: any[]): { overdue1To10: number; overdue11To20: number; overdue21: number } {
    const result = { overdue1To10: 0, overdue11To20: 0, overdue21: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
      if (diff >= 1 && diff <= 10) result.overdue1To10++;
      else if (diff >= 11 && diff <= 20) result.overdue11To20++;
      else if (diff >= 21) result.overdue21++;
    });
    return result;
  }

  daysRemaining(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
  }

  getOrgName(id: string): string {
    if (!id) return '--';
    return this.organizeList.find(o => o.id === id)?.name ?? '--';
  }

  private getLunarText(): string {
    try {
      const lunar = Lunar.fromDate(new Date());
      const d = lunar.getDay().toString().padStart(2, '0');
      const rawM = lunar.getMonth();
      const m = Math.abs(rawM).toString().padStart(2, '0');
      const isLeap = rawM < 0 ? 'N' : '';
      return `${d}/${m}${isLeap}/${lunar.getYear()}`;
    } catch {
      return '';
    }
  }
}
