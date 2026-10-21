import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedService } from '../../../../shared/services';
import { TaskReceiveService } from '../../services/task-receive.service';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { TaskDetailDrawer } from '../task-detail-drawer/task-detail-drawer';
import { TaskListFilterPanel } from '../task-list-filter/task-list-filter-panel';
import { TaskListInlineFilters } from '../task-list-filter/task-list-inline-filters';
import { emptyTaskColFilter } from '../task-list-filter/task-list-filter.helper';
import {
  TaskInformationDto,
  TaskReceiveDto,
  ReceiveListTab,
  RECEIVE_LIST_TABS,
  ReceiveListTabKey,
  TaskReceiveAssignmentRole,
  isTaskReceiveOpen,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_LABELS,
  priorityFallbackColor,
  TK_LIST_TABLE_SCROLL_Y,
} from '../../models';

@Component({
  selector: 'app-task-coordinate',
  standalone: true,
  imports: [SharedModules, TaskDetailDrawer, TaskListFilterPanel, TaskListInlineFilters],
  templateUrl: '../task-receive/task-receive.html',
  styleUrl: '../task-receive/task-receive.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCoordinate implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  readonly assignmentRole = TaskReceiveAssignmentRole.Coordinator;
  readonly drawerReceiveMode = false;
  readonly isReceiveOpen = isTaskReceiveOpen;
  data: PaginationResult = new PaginationResult();
  filter: TaskReceiveDto = new TaskReceiveDto();
  activeTab: ReceiveListTab = ReceiveListTabKey.NotAccepted;

  colFilter = emptyTaskColFilter();

  get activeTabIndex(): number {
    const idx = this.tabs.findIndex(t => t.key === this.activeTab);
    return idx >= 0 ? idx : 0;
  }

  readonly tabs = RECEIVE_LIST_TABS;
  readonly notAcceptedTabKey = ReceiveListTabKey.NotAccepted;
  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  countChuaTiepNhan = 0;

  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  documentFields: any[] = [];

  get taskStatusOptions() {
    return Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  }

  constructor(
    private global: GlobalService,
    private receiveService: TaskReceiveService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private fieldService: DocumentFieldService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private sharedService: SharedService,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Nhiệm vụ phối hợp', path: 'task-management/coordinate' },
    ]);
    this.filter.assignmentRole = this.assignmentRole;
  }

  ngOnInit(): void {
    this.bindCountBadge();
    this.loadMasterData();
    this.search();
  }

  ngAfterViewInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const taskId = params.get('taskId');
      if (taskId) setTimeout(() => this.taskDetailDrawer?.open(taskId));
    });
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
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
    load(this.fieldService, 'documentFields');
  }

  onTabChange(tab: ReceiveListTab): void {
    this.activeTab = tab;
    this.filter.currentPage = 1;
    this.search();
  }

  search(): void {
    this.applyColFilter();
    this.filter.receiveListTab = this.activeTab;
    this.filter.assignmentRole = this.assignmentRole;
    this.filter.isPaging = true;
    this.cdr.markForCheck();
    this.receiveService.searchTaskList(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res ?? new PaginationResult(); this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  private applyColFilter(): void {
    Object.assign(this.filter, {
      keyWord: this.colFilter.keyword || undefined,
      topicGroupId: this.colFilter.topicGroupId || undefined,
      documentNumber: this.colFilter.documentNumber || undefined,
      issuerOrganizationId: this.colFilter.issuerOrganizationId || undefined,
      leadOrganizationId: this.colFilter.leadOrganizationId || undefined,
      coordinateOrganizations: this.colFilter.coordinateOrganizationId || undefined,
      fieldId: this.colFilter.fieldId || undefined,
      taskDueDate: this.colFilter.dueDate ? this.formatDateParam(this.colFilter.dueDate) : undefined,
      priorityLevelId: this.colFilter.priorityLevelId || undefined,
      filterTaskStatus: this.colFilter.filterTaskStatus ?? undefined,
      filterAssignmentStatus: this.colFilter.filterAssignmentStatus ?? undefined,
    });
  }

  searchCol(): void {
    this.filter.currentPage = 1;
    this.search();
  }

  resetColFilterPanel(): void {
    this.colFilter = emptyTaskColFilter();
    this.filter.currentPage = 1;
    this.search();
  }

  private formatDateParam(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  pageIndexChange(p: number): void { this.filter.currentPage = p; this.search(); }
  pageSizeChange(s: number): void { this.filter.pageSize = s; this.filter.currentPage = 1; this.search(); }

  toggleStar(_item: TaskInformationDto, _e?: Event): void { }

  getOrgName(id: string | null | undefined): string {
    if (!id) return '';
    return this.organizes.find(o => o.id === id)?.name ?? '';
  }

  getOrgNames(ids: string | null | undefined): string {
    if (!ids) return '';
    return ids.split(',').map(id => this.getOrgName(id.trim())).filter(Boolean).join(', ');
  }

  getTopicGroupName(code: string | null | undefined): string {
    if (!code) return '';
    return this.mainTasks.find(g => g.id === code)?.name ?? '';
  }

  getFieldName(code: string | null | undefined): string {
    if (!code) return '';
    return this.documentFields.find(f => f.code === code)?.name ?? '';
  }

  formatDocNumber(item: TaskInformationDto): string {
    return item.documentNumber || item.documentSymbol || '';
  }

  getPriorityLabel(code: string | null | undefined): string {
    if (!code) return '';
    return this.taskPriorities.find(p => p.code === code)?.name ?? PRIORITY_LABELS[code] ?? code;
  }

  getPriorityColor(code: string | null | undefined): string {
    if (!code) return '#d9d9d9';
    return this.taskPriorities.find(p => p.code === code)?.color ?? priorityFallbackColor(code);
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

  openEdit(item: TaskInformationDto): void {
    this.taskDetailDrawer.openWithTask(item);
  }

  trackById = (_: number, x: { id: string }) => x.id;

  private bindCountBadge(): void {
    this.sharedService.lstCountType$
      .pipe(takeUntil(this.destroy$))
      .subscribe((countType: any) => {
        this.countChuaTiepNhan = Number(countType?.nhiemVuPhoiHopChuaTiepNhan ?? 0);
        this.cdr.markForCheck();
      });
  }
}
