import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { Subject, forkJoin, of, takeUntil, catchError } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { GlobalService } from '../../../../core/services/global.service';
import { PaginationResult } from '../../../../shared/models';
import { TaskDocumentService } from '../../services/task-document.service';
import { TaskInformationService } from '../../services/task-information.service';
import {
  TaskDocumentDto,
  TaskInformationDto,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  DocumentProcessingStatusCode,
  TaskStatusCode,
} from '../../models';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { DocumentTypeService } from '../../../master-data/services/document-type.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { DocumentUrgencyService } from '../../../master-data/services/document-urgency.service';
import { DocumentSecurityService } from '../../../master-data/services/document-security.service';
import { TaskDocumentViewDrawer } from '../task-document-view-drawer/task-document-view-drawer';
import { TaskDetailDrawer } from '../task-detail-drawer/task-detail-drawer';
import { TaskListFilterPanel } from '../task-list-filter/task-list-filter-panel';
import { emptyDocumentColFilter } from '../task-list-filter/task-list-filter.helper';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { AccountService } from '../../../system-manager/services/account.service';

interface DocumentTaskGroup {
  document: TaskDocumentDto;
  tasks: TaskInformationDto[];
  expanded: boolean;
  tasksLoading: boolean;
}

const VIEW_TABS = [
  { key: DocumentProcessingStatusCode.AssignmentCompleted, label: 'ĐANG THỰC HIỆN', icon: 'sync' },
  { key: DocumentProcessingStatusCode.Completed, label: 'HOÀN THÀNH', icon: 'check-circle' },
] as const;

@Component({
  selector: 'app-task-document-view',
  standalone: true,
  imports: [SharedModules, TaskDocumentViewDrawer, TaskDetailDrawer, TaskListFilterPanel],
  templateUrl: './task-document-view.html',
  styleUrl: './task-document-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDocumentView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('viewDrawer') viewDrawer!: TaskDocumentViewDrawer;
  @ViewChild('taskDetailDrawer') taskDetailDrawer!: TaskDetailDrawer;

  readonly tabs = VIEW_TABS;
  activeTabIndex = 0;

  documentGroups: DocumentTaskGroup[] = [];
  paginationResult: PaginationResult = new PaginationResult();
  filter: TaskDocumentDto = new TaskDocumentDto();
  colFilter = emptyDocumentColFilter();
  loading = false;

  documentTypes: any[] = [];
  documentFields: any[] = [];
  urgencyLevels: any[] = [];
  securityLevels: any[] = [];
  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = []; 
  account: any[] = [];

  readonly taskStatusLabels = TASK_STATUS_LABELS;
  readonly taskStatusColors = TASK_STATUS_COLORS;

  get activeTab() { return this.tabs[this.activeTabIndex]; }

  get allDocuments(): TaskDocumentDto[] {
    return this.documentGroups.map(g => g.document);
  }

  constructor(
    private global: GlobalService,
    private docService: TaskDocumentService,
    private taskService: TaskInformationService,
    private organizeService: OrganizeService,
    private docTypeService: DocumentTypeService,
    private fieldService: DocumentFieldService,
    private urgencyService: DocumentUrgencyService,
    private securityService: DocumentSecurityService,
    private cdr: ChangeDetectorRef,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private accountService: AccountService,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Nhiệm vụ theo văn bản', path: 'task-management/document-tasks' },
    ]);
  }

  ngOnInit(): void {
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
        next: (r: any) => { (this as any)[target] = r?.data ?? r ?? []; this.cdr.markForCheck(); }
      });
    load(this.docTypeService, 'documentTypes');
    load(this.fieldService, 'documentFields');
    load(this.urgencyService, 'urgencyLevels');
    load(this.securityService, 'securityLevels');
    load(this.organizeService, 'organizes');
    load(this.mainTaskService, 'mainTasks');
    load(this.taskPriorityService, 'taskPriorities');
    load(this.accountService, 'account')
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.filter.currentPage = 1;
    this.search();
  }

  search(): void {
    this.loading = true;
    this.documentGroups = [];
    this.cdr.markForCheck();

    const params = new TaskDocumentDto();
    params.isPaging = true;
    params.currentPage = this.filter.currentPage;
    params.pageSize = this.filter.pageSize;
    params.filterProcessingStatus = this.activeTab.key;
    params.documentListTab = '' as any;
    params.keyWord = this.filter.keyWord;
    params.fieldId = this.colFilter.fieldId;
    params.urgencyLevelId = this.colFilter.urgencyLevelId;
    params.confidentialityLevelId = this.colFilter.confidentialityLevelId;

    this.docService.search(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const result: PaginationResult = res ?? new PaginationResult();
        this.paginationResult = result;
        const docs: TaskDocumentDto[] = result.data ?? [];
        if (docs.length === 0) {
          this.loading = false;
          this.documentGroups = [];
          this.cdr.markForCheck();
          return;
        }
        this.loadTasksForDocuments(docs);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadTasksForDocuments(docs: TaskDocumentDto[]): void {
    const taskRequests = docs.map(doc =>
      this.taskService.byDocument(doc.id).pipe(catchError(() => of([]))),
    );
    forkJoin(taskRequests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (taskArrays: any[]) => {
        this.documentGroups = docs.map((doc, i) => {
          const raw = taskArrays[i];
          const tasks: TaskInformationDto[] = Array.isArray(raw) ? raw : raw?.data ?? [];
          return { document: doc, tasks, expanded: true, tasksLoading: false };
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.documentGroups = docs.map(doc => ({
          document: doc, tasks: [], expanded: true, tasksLoading: false,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleExpand(group: DocumentTaskGroup): void {
    group.expanded = !group.expanded;
    this.cdr.markForCheck();
  }

  openDrawer(group: DocumentTaskGroup): void {
    this.viewDrawer.open(group.document.id);
  }

  searchCol(): void {
    this.filter.currentPage = 1;
    this.search();
  }

  reset(): void {
    this.filter = new TaskDocumentDto();
    this.colFilter = emptyDocumentColFilter();
    this.search();
  }

  resetColFilterPanel(): void {
    this.colFilter = emptyDocumentColFilter();
    this.filter.currentPage = 1;
    this.search();
  }

  pageIndexChange(page: number): void {
    this.filter.currentPage = page;
    this.search();
  }

  pageSizeChange(size: number): void {
    this.filter.pageSize = size;
    this.filter.currentPage = 1;
    this.search();
  }

  getLabelById(list: any[], id: string | null | undefined, key = 'code', label = 'name'): string {
    if (!id) return '';
    return list.find(x => x[key] === id)?.[label] ?? id;
  }

  getAccountName(userName: string | null | undefined): string {
    if (!userName) return '';

    return this.account.find(o => o.userName === userName)?.fullName ?? userName;
  }

  getOrgName(id: string | null | undefined): string {
    if (!id) return '';
    return this.organizes.find(o => o.id === id)?.name ?? id;
  }

  getOrgNames(ids: string | null | undefined): string {
    if (!ids) return '';
    return ids.split(',')
      .map(id => id.trim()).filter(Boolean)
      .map(id => this.organizes.find(o => o.id === id)?.name ?? id)
      .join(', ');
  }

  formatDocNumberSymbol(doc: TaskDocumentDto): string {
    return doc.documentNumber || doc.documentSymbol || '';
  }

  completedCount(group: DocumentTaskGroup): number {
    return group.tasks.filter(t => t.taskStatus === TaskStatusCode.Completed).length;
  }

  openTaskDetail(task: TaskInformationDto): void {
    if (!task?.id) return;
    this.taskDetailDrawer.openWithTask(task);
  }

  trackByDocId = (_: number, g: DocumentTaskGroup) => g.document.id;
  trackById = (_: number, x: { id: string }) => x.id;
}
