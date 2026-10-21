import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { TaskReceiveService } from '../../services/task-receive.service';
import { TaskInformationService } from '../../services/task-information.service';
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
  TaskListTab,
  TASK_LIST_TABS,
  TaskListTabKey,
  TaskReceiveAssignmentRole,
  isTaskReceiveOpen,
  isTaskOpen,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_LABELS,
  priorityFallbackColor,
  TK_LIST_TABLE_SCROLL_Y,
} from '../../models';

type MyDocumentsMainTab = 'receive' | 'dispatch';

const MAIN_TABS: { key: MyDocumentsMainTab; label: string; icon: string }[] = [
  { key: 'receive', label: 'NHIỆM VỤ NHẬN', icon: 'inbox' },
  { key: 'dispatch', label: 'NHIỆM VỤ GIAO', icon: 'send' },
];

@Component({
  selector: 'app-my-documents',
  standalone: true,
  imports: [SharedModules, TaskDetailDrawer, TaskListFilterPanel, TaskListInlineFilters],
  templateUrl: './my-documents.html',
  styleUrl: './my-documents.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyDocuments implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  readonly assignmentRole = TaskReceiveAssignmentRole.Primary;
  readonly mainTabs = MAIN_TABS;
  readonly isReceiveOpen = isTaskReceiveOpen;
  readonly isTaskOpen = isTaskOpen;
  readonly receiveStatusTabs = RECEIVE_LIST_TABS;
  readonly dispatchStatusTabs = TASK_LIST_TABS;
  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  data: PaginationResult = new PaginationResult();
  receiveFilter: TaskReceiveDto = new TaskReceiveDto();
  dispatchFilter: TaskInformationDto = new TaskInformationDto();
  activeMainTab: MyDocumentsMainTab = 'receive';
  statusTab: string = ReceiveListTabKey.NotAccepted;

  colFilter = emptyTaskColFilter();

  get activeMainTabIndex(): number {
    return this.activeMainTab === 'dispatch' ? 1 : 0;
  }

  get statusTabOptions(): { key: string; label: string; icon?: string }[] {
    return this.activeMainTab === 'receive' ? this.receiveStatusTabs : this.dispatchStatusTabs;
  }

  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  documentFields: any[] = [];

  constructor(
    private global: GlobalService,
    private receiveService: TaskReceiveService,
    private taskService: TaskInformationService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private fieldService: DocumentFieldService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {
    this.global.setBreadcrumb([
      { name: 'Tài liệu của tôi', path: 'task-management/my-documents' },
    ]);
    this.receiveFilter.assignmentRole = this.assignmentRole;
    this.receiveFilter.starredOnly = true;
    this.dispatchFilter.starredOnly = true;
  }

  ngOnInit(): void {
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

  onMainTabChange(index: number): void {
    this.activeMainTab = index === 1 ? 'dispatch' : 'receive';
    this.statusTab = this.activeMainTab === 'receive'
      ? ReceiveListTabKey.NotAccepted
      : TaskListTabKey.InProgress;
    this.resetPaging();
    this.search();
  }

  onStatusTabChange(tab: string): void {
    this.statusTab = tab;
    this.resetPaging();
    this.search();
  }

  search(): void {
    this.applyColFilter();
    this.cdr.markForCheck();

    if (this.activeMainTab === 'receive') {
      this.receiveFilter.receiveListTab = this.statusTab as ReceiveListTab;
      this.receiveFilter.assignmentRole = this.assignmentRole;
      this.receiveFilter.starredOnly = true;
      this.receiveFilter.isPaging = true;
      this.receiveService.searchTaskList(this.receiveFilter).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.data = res ?? new PaginationResult(); this.cdr.markForCheck(); },
        error: () => { this.cdr.markForCheck(); },
      });
      return;
    }

    this.dispatchFilter.listTab = this.statusTab as TaskListTab;
    this.dispatchFilter.starredOnly = true;
    this.dispatchFilter.isPaging = true;
    this.taskService.search(this.dispatchFilter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res ?? new PaginationResult(); this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  private applyColFilter(): void {
    const shared = {
      keyWord: this.colFilter.keyword || undefined,
      topicGroupId: this.colFilter.topicGroupId || undefined,
      documentNumber: this.colFilter.documentNumber || undefined,
      issuerOrganizationId: this.colFilter.issuerOrganizationId || undefined,
      leadOrganizationId: this.colFilter.leadOrganizationId || undefined,
      coordinateOrganizations: this.colFilter.coordinateOrganizationId || undefined,
      fieldId: this.colFilter.fieldId || undefined,
      priorityLevelId: this.colFilter.priorityLevelId || undefined,
      filterTaskStatus: this.colFilter.filterTaskStatus ?? undefined,
      filterAssignmentStatus: this.colFilter.filterAssignmentStatus ?? undefined,
    };

    if (this.activeMainTab === 'receive') {
      Object.assign(this.receiveFilter, {
        ...shared,
        taskDueDate: this.colFilter.dueDate ? this.formatDateParam(this.colFilter.dueDate) : undefined,
      });
    } else {
      Object.assign(this.dispatchFilter, {
        ...shared,
        dueDate: this.colFilter.dueDate ? this.formatDateParam(this.colFilter.dueDate) : undefined,
      });
    }
  }

  searchCol(): void {
    this.resetPaging();
    this.search();
  }

  resetColFilterPanel(): void {
    this.colFilter = emptyTaskColFilter();
    this.resetPaging();
    this.search();
  }

  private resetPaging(): void {
    this.receiveFilter.currentPage = 1;
    this.dispatchFilter.currentPage = 1;
  }

  private formatDateParam(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  pageIndexChange(p: number): void {
    if (this.activeMainTab === 'receive') this.receiveFilter.currentPage = p;
    else this.dispatchFilter.currentPage = p;
    this.search();
  }

  pageSizeChange(s: number): void {
    if (this.activeMainTab === 'receive') {
      this.receiveFilter.pageSize = s;
      this.receiveFilter.currentPage = 1;
    } else {
      this.dispatchFilter.pageSize = s;
      this.dispatchFilter.currentPage = 1;
    }
    this.search();
  }

  toggleStar(item: TaskInformationDto, e?: Event): void {
    e?.stopPropagation();
    this.taskService.toggleStar(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.search(),
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
    return this.taskPriorities.find(p => p.code === code)?.name ?? PRIORITY_LABELS[code] ?? code;
  }

  getPriorityColor(code: string | null | undefined): string {
    if (!code) return '#d9d9d9';
    return this.taskPriorities.find(p => p.code === code)?.color ?? priorityFallbackColor(code);
  }

  getRemainingTime(dueDate: string | null | undefined, taskStatus: number): string {
    const open = this.activeMainTab === 'receive' ? isTaskReceiveOpen(taskStatus) : isTaskOpen(taskStatus);
    if (!dueDate || !open) return '';
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

  trackById = (_: number, x: { id: string }) => x.id;
}
