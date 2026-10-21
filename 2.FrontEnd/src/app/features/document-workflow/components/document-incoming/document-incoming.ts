import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageUtils } from '../../../../shared/utils';
import {
  buildDocumentWorkflowUrl,
  DcWorkflowNavigateHint,
  resolveIncomingInboxRole,
} from '../../utils/dc-workflow-nav.util';

import { forkJoin, Subscription } from 'rxjs';

import { SharedModules } from '../../../../shared/ng-zorro.module';

import { DocumentIncomingService } from '../../services/document-incoming.service';

import { DcMasterDataService, DcOption } from '../../services/dc-master-data.service';

import { DocumentDetailDrawer } from '../document-detail-drawer/document-detail-drawer';
import { DocumentCreateDrawer } from '../document-create-drawer/document-create-drawer';

import { DcListFilterBar } from '../dc-list/dc-list-filter-bar';
import { TaskListFilterPanel } from '../../../task-management/components/task-list-filter/task-list-filter-panel';

import { applyDcColFilter, emptyDcColFilter } from '../dc-list/dc-list-filter.helper';

import {

  DcListTabDef,

  DcStageListConfig,

  getIncomingStageConfig,

  getPhanLoaiOptions,

} from '../dc-list/dc-list-stage.config';

import {
  DocumentIncomingListRow,
  mapIncomingListRows,
} from '../dc-list/dc-list-row.mapper';

import {

  CapXuLy,

  DocumentIncoming,

  DocumentIncomingFilter,

  PHAN_LOAI_LABELS,

  PagedResult,

  TRANG_THAI_VBD_COLORS,

  TRANG_THAI_VBD_LABELS,

  DC_LIST_TABLE_SCROLL_Y,

} from '../../models';



@Component({

  selector: 'app-document-incoming',

  standalone: true,

  imports: [SharedModules, DocumentDetailDrawer, DocumentCreateDrawer, DcListFilterBar, TaskListFilterPanel],

  templateUrl: './document-incoming.html',

  styleUrls: ['./document-incoming.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class DocumentIncoming_List implements OnInit, OnDestroy {

  @ViewChild('createDrawer') createDrawer!: DocumentCreateDrawer;
  @ViewChild('detailDrawer') detailDrawer!: DocumentDetailDrawer;



  tabs: DcListTabDef[] = [];

  stageConfig!: DcStageListConfig;

  activeTabIndex = 0;



  readonly tableScrollY = DC_LIST_TABLE_SCROLL_Y;

  colFilter = emptyDcColFilter();



  documentFields: { code: string; name: string }[] = [];

  urgencyLevels: { code: string; name: string }[] = [];

  securityLevels: { code: string; name: string }[] = [];

  phanLoaiOptions: { value: number; label: string }[] = [];

  readonly trangThaiFilterOptions = Object.entries(TRANG_THAI_VBD_LABELS).map(([k, v]) => ({

    value: +k,

    label: v,

  }));



  cap: 'bo' | 'don-vi' = 'don-vi';

  stage = 'tiep-nhan';



  filter: DocumentIncomingFilter = { currentPage: 1, pageSize: 20 };

  result: PagedResult<DocumentIncoming> = { data: [], totalRecord: 0, totalPage: 0, currentPage: 1, pageSize: 20 };
  tableRows: DocumentIncomingListRow[] = [];



  readonly statusLabels = TRANG_THAI_VBD_LABELS;

  readonly statusColors = TRANG_THAI_VBD_COLORS;

  readonly phanLoaiLabels = PHAN_LOAI_LABELS;



  private urgencyOptions: DcOption[] = [];

  private securityOptions: DcOption[] = [];

  private sub?: Subscription;



  constructor(
    private service: DocumentIncomingService,
    private route: ActivatedRoute,
    private router: Router,
    private md: DcMasterDataService,
    private cdr: ChangeDetectorRef,
  ) {}



  ngOnInit(): void {

    forkJoin({

      documentFields: this.md.fields(),

      urgencyLevels: this.md.urgencies(),

      securityLevels: this.md.securities(),

    }).subscribe(({ documentFields, urgencyLevels, securityLevels }) => {

      this.documentFields = documentFields.map(o => ({ code: o.value, name: o.label }));

      this.urgencyLevels = urgencyLevels.map(o => ({ code: o.value, name: o.label }));

      this.securityLevels = securityLevels.map(o => ({ code: o.value, name: o.label }));

      this.urgencyOptions = urgencyLevels;

      this.securityOptions = securityLevels;

      this.cdr.markForCheck();

    });



    this.sub = this.route.paramMap.subscribe(params => {

      this.cap = (params.get('cap') as 'bo' | 'don-vi') || 'don-vi';

      this.stage = params.get('stage') || 'tiep-nhan';

      this.applyStageConfig();

      this.search();

    });

  }



  ngOnDestroy(): void { this.sub?.unsubscribe(); }



  private applyStageConfig(): void {

    this.stageConfig = getIncomingStageConfig(this.stage);

    this.tabs = this.stageConfig.tabs;

    this.phanLoaiOptions = getPhanLoaiOptions(this.cap);

    const tab = this.tabs[0];

    this.activeTabIndex = 0;

    const account = LocalStorageUtils.getItem('accountInfo') as { orgId?: string; OrgId?: string } | null;
    this.filter = {
      currentPage: 1,
      pageSize: this.filter.pageSize || 20,
      tab: tab?.key ?? this.stageConfig.defaultTabKey,
      stage: this.stage,
      inboxRole: tab?.inboxRole ?? resolveIncomingInboxRole(this.stage, 0, this.tabs),
      capXuLy: this.cap === 'bo' ? CapXuLy.Bo : CapXuLy.DonVi,
      filterPhanLoai: tab?.filterPhanLoai ?? undefined,
      filterTrangThai: tab?.filterTrangThai ?? undefined,
      organizationId: account?.orgId ?? account?.OrgId,
      keyWord: this.filter.keyWord,
      fieldId: this.filter.fieldId,
      securityLevelId: this.filter.securityLevelId,
    };
  }



  onTabChange(index: number): void {

    const tab = this.tabs[index];

    if (!tab) return;

    this.activeTabIndex = index;

    this.filter.tab = tab.key;

    this.filter.filterPhanLoai = tab.filterPhanLoai ?? undefined;
    this.filter.filterTrangThai = tab.filterTrangThai ?? undefined;
    this.filter.inboxRole = tab.inboxRole ?? resolveIncomingInboxRole(this.stage, index, this.tabs);
    this.filter.currentPage = 1;
    this.search();
  }



  searchCol(): void {

    this.filter.currentPage = 1;

    this.search();

  }



  resetColFilterPanel(): void {

    this.colFilter = emptyDcColFilter();

    this.filter.currentPage = 1;

    this.search();

  }



  resetFilters(): void {

    const tab = this.tabs[this.activeTabIndex] ?? this.tabs[0];

    this.colFilter = emptyDcColFilter();

    this.filter = {

      currentPage: 1,

      pageSize: 20,

      tab: tab?.key ?? this.stageConfig.defaultTabKey,

      capXuLy: this.cap === 'bo' ? CapXuLy.Bo : CapXuLy.DonVi,

      filterPhanLoai: tab?.filterPhanLoai ?? undefined,

    };

    this.search();

  }



  search(): void {

    applyDcColFilter(this.filter, this.colFilter, this.filter.keyWord ?? '');

    this.cdr.markForCheck();

    this.service.search(this.filter).subscribe({

      next: (res: any) => {

        this.result = res || this.result;
        this.tableRows = mapIncomingListRows(
          this.result.data ?? [],
          this.result.currentPage,
          this.result.pageSize,
          this.urgencyOptions,
          this.securityOptions,
        );

        this.cdr.markForCheck();

      },

      error: () => this.cdr.markForCheck(),

    });

  }



  openCreate(): void {
    this.createDrawer.open(this.cap === 'bo' ? CapXuLy.Bo : CapXuLy.DonVi, this.cap);
  }

  openDetail(item: DocumentIncomingListRow): void {
    if (item.id) this.detailDrawer.open(item.id, this.cap, this.stage);
  }

  onWorkflowSaved(hint?: DcWorkflowNavigateHint | void): void {
    if (hint && typeof hint === 'object' && 'stage' in hint) {
      this.router.navigate(buildDocumentWorkflowUrl(hint)).then(() => {
        this.stage = hint.stage;
        this.applyStageConfig();
        if (hint.tabIndex != null && hint.tabIndex < this.tabs.length) {
          this.activeTabIndex = hint.tabIndex;
          const tab = this.tabs[hint.tabIndex];
          this.filter.tab = tab?.key ?? this.filter.tab;
          this.filter.filterPhanLoai = tab?.filterPhanLoai ?? undefined;
          this.filter.filterTrangThai = tab?.filterTrangThai ?? undefined;
          this.filter.inboxRole = tab?.inboxRole;
        } else if (hint.tabKey) {
          const idx = this.tabs.findIndex(t => t.key === hint.tabKey);
          if (idx >= 0) this.onTabChange(idx);
        }
        this.search();
        this.cdr.markForCheck();
      });
      return;
    }
    this.search();
  }



  onPageIndex(i: number): void { this.filter.currentPage = i; this.search(); }

  onPageSize(s: number): void { this.filter.pageSize = s; this.filter.currentPage = 1; this.search(); }



  trackById = (_: number, item: DocumentIncomingListRow) => item.id;

}

