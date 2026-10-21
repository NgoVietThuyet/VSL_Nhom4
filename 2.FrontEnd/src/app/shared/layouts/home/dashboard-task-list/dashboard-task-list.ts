import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../ng-zorro.module';
import { TaskDashboardService } from '../../../../features/task-management/services/task-dashboard.service';
import { TaskInformationService } from '../../../../features/task-management/services/task-information.service';
import { TaskDetailDrawer } from '../../../../features/task-management/components/task-detail-drawer/task-detail-drawer';
import { DashboardStateService } from '../../../services/dashboard-state.service';
import { OrganizeService } from '../../../../features/master-data/services/organize.service';
import { MainTaskService } from '../../../../features/master-data/services/main-task.service';
import { TaskPriorityService } from '../../../../features/master-data/services/task-priority.service';
import { DocumentFieldService } from '../../../../features/master-data/services/document-field.service';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TaskListTabKey,
  isTaskReceiveOpen,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '../../../../features/task-management/models';

export type DashboardListType =
  | 'leader'
  | 'org-overdue'
  | 'org-all'
  | 'completion'
  | 'become-due'
  | 'overdue-range'
  | 'due-soon'
  | 'priority'
  | 'priority-org';

@Component({
  selector: 'app-dashboard-task-list',
  standalone: true,
  imports: [CommonModule, SharedModules, TaskDetailDrawer],
  templateUrl: './dashboard-task-list.html',
  styleUrl: './dashboard-task-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTaskList implements OnInit, OnDestroy {
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  private destroy$ = new Subject<void>();

  tasks: any[] = [];
  loading = false;
  title = 'Danh sách nhiệm vụ';

  listType: DashboardListType | '' = '';
  orgId = '';
  orgName = '';
  leaderUsername = '';
  leaderName = '';
  range = '';
  status = '';

  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  documentFields: any[] = [];

  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  readonly isReceiveOpen = isTaskReceiveOpen;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskDashboardService: TaskDashboardService,
    private taskInformationService: TaskInformationService,
    private stateService: DashboardStateService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private documentFieldService: DocumentFieldService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadMasterData();
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.listType = (params.get('listType') ?? '') as DashboardListType;
      this.orgId = params.get('orgId') ?? '';
      this.orgName = params.get('orgName') ?? '';
      this.leaderUsername = params.get('leaderUsername') ?? '';
      this.leaderName = params.get('leaderName') ?? '';
      this.range = params.get('range') ?? '';
      this.status = params.get('status') ?? '';
      this.title = params.get('title') ?? 'Danh sách nhiệm vụ';
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMasterData(): void {
    const load = (svc: any, target: keyof this) =>
      svc.search({ isPaging: false } as any).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: any) => { (this as any)[target] = r?.data ?? r ?? []; this.cdr.markForCheck(); },
      });
    load(this.organizeService, 'organizes');
    load(this.mainTaskService, 'mainTasks');
    load(this.taskPriorityService, 'taskPriorities');
    load(this.documentFieldService, 'documentFields');
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openTaskDetail(taskId: string): void {
    if (taskId) this.taskDetailDrawer.open(taskId);
  }

  toggleStar(item: any, e?: Event): void {
    e?.stopPropagation();
    this.taskInformationService.toggleStar(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        item.isStarred = res?.data?.isStarred ?? !item.isStarred;
        this.cdr.markForCheck();
      },
    });
  }

  getOrgName(id: string | null | undefined): string {
    if (!id) return '';
    return this.organizes.find(o => o.id === id)?.name ?? '';
  }

  getOrgNames(ids: string | null | undefined): string {
    if (!ids) return '';
    return ids.split(',').map((id: string) => this.getOrgName(id.trim())).filter(Boolean).join(', ');
  }

  getTopicGroupName(code: string | null | undefined): string {
    if (!code) return '';
    return this.mainTasks.find(g => g.id === code)?.name ?? '';
  }

  getFieldName(code: string | null | undefined): string {
    if (!code) return '';
    return this.documentFields.find(f => f.code === code)?.name ?? '';
  }

  formatDocNumber(item: any): string {
    return item.documentNumber || item.documentSymbol || '';
  }

  getPriorityLabel(code: string | null | undefined): string {
    if (!code) return '';
    return this.taskPriorities.find(p => p.code === code)?.name ?? PRIORITY_LABELS[code] ?? code;
  }

  getPriorityColor(code: string | null | undefined): string {
    if (!code) return '#d9d9d9';
    return this.taskPriorities.find(p => p.code === code)?.color ?? PRIORITY_COLORS[code] ?? '#d9d9d9';
  }

  getRemainingTime(dueDate: string | null | undefined, taskStatus: number): string {
    if (!dueDate || !isTaskReceiveOpen(taskStatus)) return '';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return '0 ngày';
    if (diff === 1) return '1 ngày';
    return `${diff} ngày`;
  }

  private loadData(): void {
    this.loading = true;
    this.tasks = [];
    this.cdr.markForCheck();

    switch (this.listType) {
      case 'priority':
        this.tasks = this.stateService.priorityTasks;
        this.loading = false;
        this.cdr.markForCheck();
        break;

      case 'priority-org':
        this.tasks = this.stateService.priorityTasksByOrg;
        this.loading = false;
        this.cdr.markForCheck();
        break;

      case 'due-soon':
        this.tasks = this.stateService.upcomingTasks;
        this.loading = false;
        this.cdr.markForCheck();
        break;

      case 'org-overdue':
        this.taskDashboardService
          .overdueTasks(this.orgId || undefined)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.tasks = Array.isArray(res) ? res : (res?.data ?? []);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
        break;

      case 'org-all':
        this.taskDashboardService
          .orgTasks(this.orgId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.tasks = Array.isArray(res) ? res : (res?.data ?? []);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
        break;

      case 'overdue-range':
        this.taskDashboardService
          .overdueTasksByRange(this.range)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.tasks = Array.isArray(res) ? res : (res?.data ?? []);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
        break;

      case 'become-due':
        this.taskDashboardService
          .becomeDueTasks(this.range)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.tasks = Array.isArray(res) ? res : (res?.data ?? []);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
        break;

      case 'leader':
        this.taskDashboardService
          .leaderTasks(this.leaderUsername)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.tasks = Array.isArray(res) ? res : (res?.data ?? []);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.cdr.markForCheck();
            },
          });
        break;

      case 'completion':
        this.loadCompletionTasks();
        break;

      default:
        this.loading = false;
        this.cdr.markForCheck();
    }
  }

  private loadCompletionTasks(): void {
    if (this.status === 'overdue') {
      // Lấy đúng list từ state (đã tính dueDate < hôm nay, chưa done/stopped)
      this.tasks = this.stateService.overdueTaskList;
      this.loading = false;
      this.cdr.markForCheck();
    } else if (this.status === 'intime') {
      // Lấy đúng list từ state (đã tính dueDate >= hôm nay hoặc không có dueDate, chưa done/stopped)
      this.tasks = this.stateService.inTimeTaskList;
      this.loading = false;
      this.cdr.markForCheck();
    } else {
      // done
      this.taskInformationService
        .search({ isPaging: false, listTab: TaskListTabKey.Completed } as any)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.tasks = res?.data ?? (Array.isArray(res) ? res : []);
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
    }
  }

  daysOverdue(deadlineInput: string | Date | undefined | null): number {
    if (!deadlineInput) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineInput as string);
    deadline.setHours(0, 0, 0, 0);
    const diff = today.getTime() - deadline.getTime();
    return diff > 0 ? Math.floor(diff / 86400000) : 0;
  }

  daysRemaining(deadlineInput: string | Date | undefined | null): number {
    if (!deadlineInput) return 0;
    const today = new Date();
    const deadline = new Date(deadlineInput as string);
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diff = deadline.getTime() - today.getTime();
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
  }

  trackById = (_: number, x: any) => x.id;
}
