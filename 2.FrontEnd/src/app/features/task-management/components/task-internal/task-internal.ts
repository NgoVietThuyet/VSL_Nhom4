import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { MainTaskDto, MAIN_TASK_STATUS } from '../../../master-data/models/main-task.model';
import { TaskInformationService } from '../../services/task-information.service';
import {
  TaskInformationDto, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  PRIORITY_LABELS, priorityFallbackColor, TaskInformationStatus,
  mapExtractedTaskToInformationDto, ExtractedTask,
  TK_INTERNAL_TABLE_SCROLL_Y,
} from '../../models';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { TaskEditModal } from '../task-edit-modal/task-edit-modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';

type PanelView = 'all' | 'pending' | 'doing' | 'done';

@Component({
  selector: 'app-task-internal',
  standalone: true,
  imports: [SharedModules, TaskEditModal],
  templateUrl: './task-internal.html',
  styleUrl: './task-internal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInternal implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filter: MainTaskDto = new MainTaskDto();
  treeData: any[] = [];
  selectedMainTaskId?: string;
  selectedMainTask?: any;
  childTasks: TaskInformationDto[] = [];
  loadingChild = false;
  taskPanelView: PanelView = 'all';

  drawerVisible = false;
  drawerMode: 'create-root' | 'create-sub' | 'edit' | 'view' = 'create-root';
  drawerSaving = false;
  mainTaskForm: MainTaskDto = new MainTaskDto();
  parentMainTask?: MainTaskDto;

  taskEditVisible = false;
  editingTask: ExtractedTask | null = null;

  organizes: any[] = [];
  mainTaskList: MainTaskDto[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  documentFields: any[] = [];

  readonly mainTaskStatus = MAIN_TASK_STATUS;
  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;
  readonly taskTableScrollY = TK_INTERNAL_TABLE_SCROLL_Y;

  constructor(
    private global: GlobalService,
    private mainTaskService: MainTaskService,
    private taskService: TaskInformationService,
    private organizeService: OrganizeService,
    private taskPriorityService: TaskPriorityService,
    private fieldService: DocumentFieldService,
    private cdr: ChangeDetectorRef,
    private notification: NzNotificationService,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Nhiệm vụ chuyên đề', path: 'task-management/internal' },
    ]);
  }

  ngOnInit(): void {
    this.filter.isPaging = false;
    this.filter.pageSize = 9999;
    this.loadMasterData();
    this.search();
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

  getRemainingTime(dueDate: string | null | undefined, status: number): string {
    if (!dueDate || status >= 2) return '';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return '0 ngày';
    if (diff === 1) return '1 ngày';
    return `${diff} ngày`;
  }

  search(): void {
    this.mainTaskService.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const rows = res?.data ?? [];
        this.mainTaskList = rows;
        this.buildTree(rows);
        this.cdr.markForCheck();
      },
    });
  }

  private buildTree(rows: MainTaskDto[]): void {
    const map = new Map<string, any>();
    const roots: any[] = [];
    rows.forEach(item => {
      map.set(item.id, { ...item, children: [], expanded: false, hasChildren: (item.childrenCount ?? 0) > 0 });
    });
    rows.forEach(item => {
      const node = map.get(item.id)!;
      if (!item.parentId) roots.push(node);
      else {
        const parent = map.get(item.parentId);
        if (parent) { parent.children.push(node); parent.hasChildren = true; }
        else roots.push(node);
      }
    });
    this.treeData = roots;
  }

  toggleExpand(node: any, e?: Event): void {
    e?.stopPropagation();
    node.expanded = !node.expanded;
    this.cdr.markForCheck();
  }

  onSelectMainTask(node: any): void {
    if (this.selectedMainTaskId === node.id) {
      this.clearSelection();
      return;
    }
    this.selectedMainTaskId = node.id;
    this.selectedMainTask = node;
    this.taskPanelView = 'all';
    this.loadChildTasks(node.id);
  }

  clearSelection(): void {
    this.selectedMainTaskId = undefined;
    this.selectedMainTask = undefined;
    this.childTasks = [];
    this.cdr.markForCheck();
  }

  loadChildTasks(mainTaskId: string): void {
    this.loadingChild = true;
    this.cdr.markForCheck();
    const f = new TaskInformationDto();
    f.topicGroupId = mainTaskId;
    f.isPaging = false;
    f.pageSize = 9999;
    this.taskService.search(f).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.childTasks = res?.data ?? [];
        this.loadingChild = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingChild = false;
        this.childTasks = [];
        this.cdr.markForCheck();
      },
    });
  }

  changeTaskView(view: PanelView): void {
    this.taskPanelView = view;
    this.cdr.markForCheck();
  }

  getFilteredTasks(): TaskInformationDto[] {
    let tasks = [...this.childTasks];
    switch (this.taskPanelView) {
      case 'pending': tasks = tasks.filter(t => (t.taskStatus ?? 0) === 0); break;
      case 'doing': tasks = tasks.filter(t => (t.taskStatus ?? 0) === 1); break;
      case 'done': tasks = tasks.filter(t => (t.taskStatus ?? 0) === TaskInformationStatus.Completed); break;
    }
    return tasks;
  }

  countByView(view: PanelView): number {
    switch (view) {
      case 'pending': return this.childTasks.filter(t => (t.taskStatus ?? 0) === 0).length;
      case 'doing': return this.childTasks.filter(t => (t.taskStatus ?? 0) === 1).length;
      case 'done': return this.childTasks.filter(t => (t.taskStatus ?? 0) === TaskInformationStatus.Completed).length;
      default: return this.childTasks.length;
    }
  }

  onCreateRoot(): void {
    this.drawerMode = 'create-root';
    this.parentMainTask = undefined;
    this.initForm();
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  onCreateSub(parent: MainTaskDto): void {
    this.drawerMode = 'create-sub';
    this.parentMainTask = parent;
    this.initForm();
    this.mainTaskForm.parentId = parent.id;
    this.drawerVisible = true;
    this.cdr.markForCheck();
  }

  onEdit(node: MainTaskDto, e?: Event): void {
    e?.stopPropagation();
    this.drawerMode = 'edit';
    this.parentMainTask = undefined;
    this.mainTaskService.detail(node.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.mainTaskForm = this.parseMainTaskDates(res);
        this.drawerVisible = true;
        this.cdr.markForCheck();
      },
    });
  }

  initForm(): void {
    this.mainTaskForm = new MainTaskDto();
    this.mainTaskForm.status = 1;
    this.mainTaskForm.progress = 0;
  }

  get isDrawerEdit(): boolean {
    return this.drawerMode === 'edit';
  }

  get drawerTitle(): string {
    return this.isDrawerEdit ? 'CHỈNH SỬA' : 'TẠO MỚI';
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.mainTaskForm = new MainTaskDto();
    this.cdr.markForCheck();
  }

  saveMainTask(): void {
    if (!this.mainTaskForm.name?.trim()) {
      this.notification.warning('Cảnh báo','Vui lòng nhập tên nhóm nhiệm vụ');
      return;
    }
    this.drawerSaving = true;
    this.cdr.markForCheck();
    let req$;
    if (this.drawerMode === 'create-sub' && this.parentMainTask?.id) {
      req$ = this.mainTaskService.createSubMainTask(this.parentMainTask.id, this.mainTaskForm);
    } else if (this.drawerMode === 'edit') {
      req$ = this.mainTaskService.update(this.mainTaskForm);
    } else {
      req$ = this.mainTaskService.insert(this.mainTaskForm);
    }
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.drawerSaving = false;
        this.closeDrawer();
        this.search();
        if (this.selectedMainTaskId) this.loadChildTasks(this.selectedMainTaskId);
      },
      error: () => { this.drawerSaving = false; this.cdr.markForCheck(); },
    });
  }

  deleteMainTask(node: MainTaskDto, e?: Event): void {
    e?.stopPropagation();
    this.mainTaskService.delete(node.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.selectedMainTaskId === node.id) this.clearSelection();
        this.search();
      },
    });
  }

  getProgressColor(p: number): string {
    if (p >= 100) return '#52c41a';
    if (p >= 70) return '#1890ff';
    if (p >= 40) return '#faad14';
    return '#ff4d4f';
  }

  openEditTask(item: TaskInformationDto): void {
    this.editingTask = {
      order: 0,
      id: item.id,
      taskContent: item.description || item.title || '',
      deadline: '',
      deadlineDate: item.dueDate ? new Date(item.dueDate) : null,
      topicGroupId: item.topicGroupId ?? this.selectedMainTaskId ?? '',
      leadOrganizationId: item.leadOrganizationId ?? '',
      leadOrganizationIds: (item.leadOrganizationId ?? '').split(',').map(id => id.trim()).filter(Boolean),
      coordinateOrganizationIds: (item.coordinateOrganizations ?? '').split(',').filter(Boolean),
      priorityLevelId: item.priorityLevelId ?? '',
      status: item.taskStatus ?? 0,
      isFromDocument: item.isFromDocument ?? false,
      fieldId: item.fieldId ?? '',
      regions: [],
    };
    this.taskEditVisible = true;
    this.cdr.markForCheck();
  }

  onTaskEditSave(updated: ExtractedTask): void {
    if (!updated.id) {
      this.notification.error('Cảnh báo','Không xác định được nhiệm vụ cần cập nhật');
      return;
    }
    const dto = mapExtractedTaskToInformationDto(updated);
    dto.id = updated.id;
    this.taskService.update(dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.taskEditVisible = false;
        this.editingTask = null;
        this.notification.success('Thành công','Cập nhật nhiệm vụ thành công');
        if (this.selectedMainTaskId) this.loadChildTasks(this.selectedMainTaskId);
        this.cdr.markForCheck();
      },
      error: () => this.notification.error('Thất bại','Cập nhật nhiệm vụ thất bại'),
    });
  }

  reset(): void {
    this.filter = new MainTaskDto();
    this.filter.isPaging = false;
    this.filter.pageSize = 9999;
    this.search();
  }

  trackById = (_: number, x: { id: string }) => x.id;

  private parseMainTaskDates(d: MainTaskDto): MainTaskDto {
    const copy = { ...d };
    if (copy.startDate) copy.startDate = new Date(copy.startDate as string);
    if (copy.deadline) copy.deadline = new Date(copy.deadline as string);
    if (copy.endDate) copy.endDate = new Date(copy.endDate as string);
    return copy;
  }
}
