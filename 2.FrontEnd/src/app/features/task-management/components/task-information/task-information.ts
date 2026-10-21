import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { TaskInformationService } from '../../services/task-information.service';
import { TaskDispatchService } from '../../services/task-dispatch.service';
import { TaskTrackingService } from '../../services/task-tracking.service';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { TaskDetailDrawer } from '../task-detail-drawer/task-detail-drawer';
import { TaskListFilterPanel } from '../task-list-filter/task-list-filter-panel';
import { TaskListInlineFilters } from '../task-list-filter/task-list-inline-filters';
import { emptyTaskColFilter } from '../task-list-filter/task-list-filter.helper';
import {
  TaskInformationDto, TaskListTab, TASK_LIST_TABS, TaskListTabKey,
  TaskTreeNodeDto,
  DispatchRequestDto, DispatchTargetDto,
  TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS,
  PRIORITY_LABELS, priorityFallbackColor,
  ASSIGNMENT_ROLE_LABELS, ASSIGNMENT_ROLE_COLORS,
  isTaskOpen, TK_LIST_TABLE_SCROLL_Y,
} from '../../models';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-task-information',
  standalone: true,
  imports: [SharedModules, TaskDetailDrawer, TaskListFilterPanel, TaskListInlineFilters],
  templateUrl: './task-information.html',
  styleUrl: './task-information.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInformation implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  data: PaginationResult = new PaginationResult();
  filter: TaskInformationDto = new TaskInformationDto();
  activeTab: TaskListTab = TaskListTabKey.InProgress;

  colFilter = emptyTaskColFilter();

  get activeTabIndex(): number {
    const idx = this.tabs.findIndex(t => t.key === this.activeTab);
    return idx >= 0 ? idx : 0;
  }

  readonly tabs = TASK_LIST_TABS;
  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;
  readonly isTaskOpen = isTaskOpen;
  readonly tabKey = TaskListTabKey;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  readonly assignmentStatusLabels = ASSIGNMENT_STATUS_LABELS;
  readonly assignmentStatusColors = ASSIGNMENT_STATUS_COLORS;
  readonly roleLabels = ASSIGNMENT_ROLE_LABELS;
  readonly roleColors = ASSIGNMENT_ROLE_COLORS;

  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  documentFields: any[] = [];

  dispatchDrawerVisible = false;
  dispatchRequest: DispatchRequestDto = new DispatchRequestDto();
  newTarget: DispatchTargetDto = new DispatchTargetDto();

  treeDrawerVisible = false;
  taskTree: TaskTreeNodeDto | null = null;

  get roleOptions() {
    return Object.entries(ASSIGNMENT_ROLE_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  }

  get taskStatusOptions() {
    return Object.entries(TASK_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  }
  get assignmentStatusOptions() {
    return Object.entries(ASSIGNMENT_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  }

  constructor(
    private global: GlobalService,
    private taskService: TaskInformationService,
    private dispatchService: TaskDispatchService,
    private trackingService: TaskTrackingService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private fieldService: DocumentFieldService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private notification: NzNotificationService
    
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Nhiệm vụ giao', path: 'task-management/tasks' },
    ]);
  }

  ngOnInit(): void {
    this.loadMasterData();
    this.search();
  }

  ngAfterViewInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const taskId = params.get('taskId');
      if (taskId) {
        setTimeout(() => this.taskDetailDrawer?.open(taskId));
      }
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

  onTabChange(tab: TaskListTab): void {
    this.activeTab = tab;
    this.filter.currentPage = 1;
    this.search();
  }

  search(): void {
    this.applyColFilter();
    this.filter.listTab = this.activeTab;
    this.filter.isPaging = true;
    this.cdr.markForCheck();
    this.taskService.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
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
      dueDate: this.colFilter.dueDate ? this.formatDateParam(this.colFilter.dueDate) : undefined,
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

  toggleStar(item: TaskInformationDto, e?: Event): void {
    e?.stopPropagation();
    this.taskService.toggleStar(item.id).pipe(takeUntil(this.destroy$)).subscribe({
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
    return this.taskPriorities.find(p => p.code === code)?.name
      ?? PRIORITY_LABELS[code] ?? code;
  }

  getPriorityColor(code: string | null | undefined): string {
    if (!code) return '#d9d9d9';
    return this.taskPriorities.find(p => p.code === code)?.color
      ?? priorityFallbackColor(code);
  }

  getRemainingTime(dueDate: string | null | undefined, status: number): string {
    if (!dueDate || !isTaskOpen(status)) return '';
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
    this.taskDetailDrawer.open(item.id);
  }

  openDispatch(task: TaskInformationDto): void {
    this.dispatchRequest = new DispatchRequestDto();
    this.dispatchRequest.taskId = task.id;
    this.newTarget = new DispatchTargetDto();
    this.dispatchDrawerVisible = true;
    this.cdr.markForCheck();
  }

  addTarget(): void {
    if (!this.newTarget.organizationId) return;
    this.dispatchRequest.targets.push({ ...this.newTarget });
    this.newTarget = new DispatchTargetDto();
    this.cdr.markForCheck();
  }

  removeTarget(i: number): void {
    this.dispatchRequest.targets.splice(i, 1);
    this.cdr.markForCheck();
  }

  saveDispatch(): void {
    if (!this.dispatchRequest.taskId || !this.dispatchRequest.targets.length) {
      this.notification.warning('Cảnh báo','Chọn nhiệm vụ và ít nhất một đơn vị nhận');
      return;
    }
    this.dispatchService.dispatch(this.dispatchRequest).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.dispatchDrawerVisible = false;
        this.notification.success('Thành công','Giao việc thành công');
        this.search();
        this.cdr.markForCheck();
      },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  openTree(task: TaskInformationDto): void {
    this.trackingService.taskTree(task.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.taskTree = res;
        this.treeDrawerVisible = true;
        this.cdr.markForCheck();
      },
    });
  }

  toNzTreeNodes(nodes: TaskTreeNodeDto[]): any[] {
    return nodes.map(n => ({
      title: n.label ?? n.id,
      key: n.id,
      isLeaf: !n.children?.length,
      expanded: true,
      children: n.children?.length ? this.toNzTreeNodes(n.children) : [],
      nodeType: n.type,
      progressPercent: n.progressPercent,
      assignmentRole: n.assignmentRole,
    }));
  }

  getNodeIcon(type: string): string {
    return type === 'task' ? 'file-text' : type === 'dispatch' ? 'send' : 'inbox';
  }

  getNodeColor(type: string): string {
    return type === 'task' ? 'blue' : type === 'dispatch' ? 'orange' : 'green';
  }

  trackById = (_: number, x: { id: string }) => x.id;
}
