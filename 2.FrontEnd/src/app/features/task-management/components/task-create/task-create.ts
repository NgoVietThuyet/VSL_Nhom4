import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnDestroy, OnInit, AfterViewInit, ViewChild,
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { TaskDocumentService } from '../../services/task-document.service';
import {
  TaskDocumentDto, DocumentListTab, CREATE_LIST_TABS,
  DOCUMENT_STATUS_COLORS, DOCUMENT_STATUS_LABELS,
  TK_LIST_TABLE_SCROLL_Y,
} from '../../models';
import { DocumentTypeService } from '../../../master-data/services/document-type.service';
import { DocumentFieldService } from '../../../master-data/services/document-field.service';
import { DocumentUrgencyService } from '../../../master-data/services/document-urgency.service';
import { DocumentSecurityService } from '../../../master-data/services/document-security.service';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { MainTaskService } from '../../../master-data/services/main-task.service';
import { TaskPriorityService } from '../../../master-data/services/task-priority.service';
import { TaskDocumentDrawer } from '../task-document-drawer/task-document-drawer';
import { TaskListFilterPanel } from '../task-list-filter/task-list-filter-panel';
import { TaskListInlineFilters } from '../task-list-filter/task-list-inline-filters';
import { emptyDocumentColFilter } from '../task-list-filter/task-list-filter.helper';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [SharedModules, TaskDocumentDrawer, TaskListFilterPanel, TaskListInlineFilters],
  templateUrl: './task-create.html',
  styleUrl: './task-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreate implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('docDrawer') docDrawer!: TaskDocumentDrawer;
  data: PaginationResult = new PaginationResult();
  filter: TaskDocumentDto = new TaskDocumentDto();
  activeTab: DocumentListTab = 'in_progress';
  readonly tabs = CREATE_LIST_TABS;
  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;

  get activeTabIndex(): number {
    const idx = this.tabs.findIndex(t => t.key === this.activeTab);
    return idx >= 0 ? idx : 0;
  }

  colFilter = emptyDocumentColFilter();

  documentTypes: any[] = [];
  documentFields: any[] = [];
  urgencyLevels: any[] = [];
  securityLevels: any[] = [];
  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  readonly statusOptions = Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => ({ value: +k, label: v }));
  statusLabels = DOCUMENT_STATUS_LABELS;
  statusColors = DOCUMENT_STATUS_COLORS;

  constructor(
    private global: GlobalService,
    private docService: TaskDocumentService,
    private docTypeService: DocumentTypeService,
    private fieldService: DocumentFieldService,
    private urgencyService: DocumentUrgencyService,
    private securityService: DocumentSecurityService,
    private organizeService: OrganizeService,
    private mainTaskService: MainTaskService,
    private taskPriorityService: TaskPriorityService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Tạo nhiệm vụ', path: 'task-management/create' },
    ]);
  }

  ngOnInit(): void {
    this.filter.isManualFilter = true;
    this.loadMasterData();
    this.search();
  }

  ngAfterViewInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => this.applyRouteQuery(params));
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
  }

  getLabelById(list: any[], id: string | null | undefined, key = 'code', label = 'name'): string {
    if (!id) return '';
    return list.find(x => x[key] === id)?.[label] ?? id;
  }

  formatDocNumberSymbol(item: TaskDocumentDto): string {
    return item.documentNumber || item.documentSymbol || item.subject || '—';
  }

  onTabChange(tab: DocumentListTab): void {
    this.activeTab = tab;
    this.filter.currentPage = 1;
    this.search();
  }

  search(): void {
    this.applyColFilter();
    this.filter.documentListTab = this.activeTab;
    this.filter.isManualFilter = true;
    this.filter.isPaging = true;
    this.cdr.markForCheck();
    this.docService.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res ?? new PaginationResult(); this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); },
    });
  }

  private applyColFilter(): void {
    Object.assign(this.filter, {
      documentNumber: this.colFilter.documentNumber || undefined,
      subject: this.colFilter.subject || undefined,
      documentTypeId: this.colFilter.documentTypeId || undefined,
      fieldId: this.colFilter.fieldId || undefined,
      urgencyLevelId: this.colFilter.urgencyLevelId || undefined,
      confidentialityLevelId: this.colFilter.confidentialityLevelId || undefined,
      filterProcessingStatus: this.colFilter.filterProcessingStatus ?? undefined,
    });
  }

  searchCol(): void {
    this.filter.currentPage = 1;
    this.search();
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.filter.currentPage = 1;
      this.search();
    }
  }

  resetColFilterPanel(): void {
    this.colFilter = emptyDocumentColFilter();
    this.filter.currentPage = 1;
    this.search();
  }

  reset(): void {
    this.filter = new TaskDocumentDto();
    this.filter.isManualFilter = true;
    this.colFilter = emptyDocumentColFilter();
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

  openDocumentDrawer(item?: TaskDocumentDto): void {
    this.syncRoute({
      docId: item?.id ?? 'new',
      taskId: null,
      taskIndex: null,
    });
  }

  onDocumentSaved(event: { id: string; isNew: boolean }): void {
    this.search();
    if (event.isNew) {
      this.syncRoute({ docId: event.id, taskId: null, taskIndex: null }, true);
    }
  }

  onDrawerClosed(): void {
    this.syncRoute({ docId: null, taskId: null, taskIndex: null });
  }

  onDrawerRouteSync(q: { taskId?: string | null; taskIndex?: number | null }): void {
    const docId = this.route.snapshot.queryParamMap.get('docId');
    if (!docId) return;
    this.syncRoute({ docId, taskId: q.taskId ?? null, taskIndex: q.taskIndex ?? null });
  }

  private syncRoute(
    q: { docId?: string | null; taskId?: string | null; taskIndex?: number | null },
    replaceUrl = false,
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        docId: q.docId || null,
        taskId: q.taskId ?? null,
        taskIndex: q.taskIndex != null ? q.taskIndex : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  private applyRouteQuery(map: ParamMap): void {
    if (!this.docDrawer) return;
    const docId = map.get('docId');
    if (!docId) {
      this.docDrawer.closeIfOpen();
      return;
    }
    const taskId = map.get('taskId');
    const taskIndexStr = map.get('taskIndex');
    const taskIndex = taskIndexStr != null && taskIndexStr !== '' ? +taskIndexStr : null;
    this.docDrawer.openForRoute(docId, {
      taskId: taskId || null,
      taskIndex: taskIndex != null && !Number.isNaN(taskIndex) ? taskIndex : null,
    });
  }

  deleteDocument(id: string): void {
    this.docService.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { 
        // this.msg.success('Đã xoá');
        this.search(); },
    });
  }

  trackById = (_: number, x: { id: string }) => x.id;
}
