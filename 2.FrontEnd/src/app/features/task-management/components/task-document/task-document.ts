import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, OnDestroy, OnInit, AfterViewInit, ViewChild,
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, forkJoin, takeUntil, finalize } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { GlobalService } from '../../../../core/services/global.service';
import { TaskDocumentService } from '../../services/task-document.service';
import {
  TaskDocumentDto, DocumentListTab, DOCUMENT_LIST_TABS,
  DOCUMENT_STATUS_COLORS, DOCUMENT_STATUS_LABELS,
  DocumentListTabKey,
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
import { OcrQueueModal } from '../ocr-queue-modal/ocr-queue-modal';
import { SignalRService } from '../../../../shared/services/signalr.service';
import { AccountService } from '../../../system-manager/services/account.service';

@Component({
  selector: 'app-task-document',
  standalone: true,
  imports: [SharedModules, TaskDocumentDrawer, OcrQueueModal, TaskListFilterPanel, TaskListInlineFilters],
  templateUrl: './task-document.html',
  styleUrl: './task-document.scss',
  host: { class: 'task-doc-host' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDocument implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('docDrawer') docDrawer!: TaskDocumentDrawer;
  @ViewChild('ocrModal') ocrModal!: OcrQueueModal;
  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  ocrQueueVisible = false;
  importing = false;

  data: PaginationResult = new PaginationResult();
  filter: TaskDocumentDto = new TaskDocumentDto();
  activeTab: DocumentListTab = 'in_progress';
  readonly tabs = DOCUMENT_LIST_TABS;
  readonly tableScrollY = TK_LIST_TABLE_SCROLL_Y;



  get activeTabIndex(): number {
    const idx = this.tabs.findIndex(t => t.key === this.activeTab);
    return idx >= 0 ? idx : 0;
  }

  get isMergedTab(): boolean {
    return this.activeTab === DocumentListTabKey.InProgress;
  }

  colFilter = emptyDocumentColFilter();

  documentTypes: any[] = [];
  documentFields: any[] = [];
  urgencyLevels: any[] = [];
  securityLevels: any[] = [];
  organizes: any[] = [];
  mainTasks: any[] = [];
  taskPriorities: any[] = [];
  account: any[]=[];
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
    private signalr: SignalRService,
    private accountService: AccountService,
  ) {
    this.global.setBreadcrumb([
      { name: 'Quản lý nhiệm vụ', path: 'task-management' },
      { name: 'Nhiệm vụ văn bản', path: 'task-management/documents' },
    ]);
  }

  ngOnInit(): void {
    this.getOrg()
    this.filter.isManualFilter = undefined;
    this.loadMasterData();
    this.search();
    this.signalr.ocrComplete$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.search();
      this.cdr.markForCheck();
    });

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
    // load(this.organizeService, 'organizes');
    load(this.mainTaskService, 'mainTasks');
    load(this.taskPriorityService, 'taskPriorities');
    load(this.accountService, 'account')
    

  }

  getOrg(): void {
  this.organizeService
    .search({ isPaging: false } as any)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (r: any) => {
        this.organizes = r?.data ?? r ?? [];
        this.cdr.markForCheck();
      }
    });
}

  getUrgencyColor(level: string): string | null {
    switch (level) {
      case 'HOA_TOC':
        return '#f50';
      case 'THUONG_KHAN':
        return '#d46b08';
      case 'KHAN':
        return '#d4b106';
      default:
        return null;
    }
  }

  getConfidentialityInfo(level: string) {
    switch (level) {
      case 'MAT_DAC_BIET':
        return { text: 'A', class: 'circle-letter-red' };

      case 'TOI_MAT':
        return { text: 'B', class: 'circle-letter-green' };

      case 'MAT':
        return { text: 'C', class: 'circle-letter-blue' };

      default:
        return null;
    }
  }

  getLabelById(list: any[], id: string | null | undefined, key = 'code', label = 'name'): string {
    if (!id) return '';
    return list.find(x => x[key] === id)?.[label] ?? id;
  }

  getOrgName(id: string): any {
    if (!id) return '';
    return this.organizes.find(x => x.id === id)?.name ?? id;
  }

  formatDocNumberSymbol(item: TaskDocumentDto): string {
    return item.documentNumber || item.documentSymbol || '';
  }

  onTabChange(tab: DocumentListTab): void {
    this.activeTab = tab;
    this.filter.currentPage = 1;
    this.search();
  }

  mergedAllData: any[] = [];          
  mergedPage = 1;
  mergedPageSize = 10;

  get mergedPagedData(): any[] {
    const start = (this.mergedPage - 1) * this.mergedPageSize;
    return this.mergedAllData.slice(start, start + this.mergedPageSize);
  }

  search(): void {
    this.applyColFilter();
    this.filter.isManualFilter = undefined;
    this.cdr.markForCheck();

    if (this.isMergedTab) {
    const base = { ...this.filter, isPaging: false };
    forkJoin([
      this.docService.search({ ...base, documentListTab: DocumentListTabKey.NotProcessed as DocumentListTab }),
      this.docService.search({ ...base, documentListTab: DocumentListTabKey.InProgress as DocumentListTab }),
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([r1, r2]: any[]) => {
        const d1: any[] = r1?.data ?? (Array.isArray(r1) ? r1 : []);
        const d2: any[] = r2?.data ?? (Array.isArray(r2) ? r2 : []);
        this.mergedAllData = [...d1, ...d2];

        // Nếu đang ở trang vượt quá tổng trang mới → reset về trang 1
        const maxPage = Math.ceil(this.mergedAllData.length / this.mergedPageSize) || 1;
        if (this.mergedPage > maxPage) this.mergedPage = 1;

        this.data = Object.assign(new PaginationResult(), {
          data: this.mergedPagedData,
          totalRecord: this.mergedAllData.length,
          currentPage: this.mergedPage,
          pageSize: this.mergedPageSize,
        });
        this.cdr.markForCheck();
      },
      error: () => { this.cdr.markForCheck(); },
    });
  } else {
      this.filter.documentListTab = this.activeTab;
      this.filter.isPaging = true;
      this.docService.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.data = res ?? new PaginationResult(); this.cdr.markForCheck(); },
        error: () => { this.cdr.markForCheck(); },
      });
    }
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
      event.stopPropagation();
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
    this.filter.isManualFilter = undefined;
    this.colFilter = emptyDocumentColFilter();
    this.search();
  }

  mergedPageIndexChange(page: number): void {
    this.mergedPage = page;
    this.data = Object.assign(new PaginationResult(), {
      data: this.mergedPagedData,
      totalRecord: this.mergedAllData.length,
      currentPage: this.mergedPage,
      pageSize: this.mergedPageSize,
    });
    this.cdr.markForCheck();
  }

  mergedPageSizeChange(size: number): void {
    this.mergedPageSize = size;
    this.mergedPage = 1;
    this.data = Object.assign(new PaginationResult(), {
      data: this.mergedPagedData,
      totalRecord: this.mergedAllData.length,
      currentPage: this.mergedPage,
      pageSize: this.mergedPageSize,
    });
    this.cdr.markForCheck();
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
    this.syncRoute({
      docId,
      taskId: q.taskId ?? null,
      taskIndex: q.taskIndex ?? null,
    });
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

  openOcrQueue(): void {
    this.ocrModal.open();
  }

  onOcrBatchSaved(): void {
    this.search();
  }

  onImportExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.importing = true;
    this.cdr.markForCheck();
    this.docService.importExcel(file).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.importing = false;
        input.value = '';
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (res: any) => {
        const firstDocId = res?.data?.documentIds?.[0];
        this.search();
        if (firstDocId) {
          setTimeout(() => this.openDocumentDrawer({ id: firstDocId } as any), 300);
        }
      },
    });
  }

  trackById = (_: number, x: { id: string }) => x.id;

  calcMinus(a: any, b: any){
    return a-b
  }
}
