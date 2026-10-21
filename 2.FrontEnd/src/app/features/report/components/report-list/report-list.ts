import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportService } from '../../services/report.service';
import { ReportDefinitionService } from '../../services/report-definition.service';
import { ReportPeriodService } from '../../services/report-period.service';
import { ReportStatusService } from '../../services/report-status.service';
import { CommonService } from '../../../../shared/services';
import { ReportDto } from '../../models/report.model';
import { LocalStorageUtils } from '../../../../shared/utils';
import { SignalRService } from '../../../../shared/services/signalr.service';

@Component({
  selector: 'app-report-list',
  imports: [SharedModules],
  templateUrl: './report-list.html'
})
export class ReportList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: PaginationResult = new PaginationResult();
  filter: ReportDto = new ReportDto();
  visible = false;
  dto: ReportDto = new ReportDto();
  definitions: any[] = [];
  periods: any[] = [];
  statuses: any[] = [];
  organizes: any[] = [];
  accountInfo: any;

  constructor(
    private global: GlobalService,
    private router: Router,
    private service: ReportService,
    private definitionSrv: ReportDefinitionService,
    private periodSrv: ReportPeriodService,
    private statusSrv: ReportStatusService,
    private commonSrv: CommonService,
    private signalR: SignalRService
  ) {
    this.global.setBreadcrumb([{ name: 'Báo cáo', path: 'report/list' }]);
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.search();
    this.signalR.reportEvent$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.search()
    });
    this.definitionSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.definitions = r || [] });
    this.periodSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.periods = r || [] });
    this.statusSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.statuses = r || [] });
    this.commonSrv.get('Organize/GetAll', {}).pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.organizes = r || [] });
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res; }
    });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }

  get filteredPeriods(): any[] {
    if (!this.dto.definitionId) return this.periods;
    const def = this.definitions.find(d => d.id === this.dto.definitionId);
    if (!def?.periodTypeCode) return this.periods;
    return this.periods.filter(p => p.periodTypeCode === def.periodTypeCode);
  }

  onDefinitionChange(_: any): void {
    const match = this.filteredPeriods.find(p => p.code === this.dto.periodCode);
    if (!match) this.dto.periodCode = '';
  }

  open() {
    this.visible = true;
    this.dto = new ReportDto();
    this.dto.statusCode = 'DRAFT';
    if (this.accountInfo?.orgId) {
      this.dto.organizeId = this.accountInfo.orgId;
    }
  }

  close() { this.visible = false; }

  create() {
    this.service.create(this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.visible = false;
        this.search();
        if (res?.data) this.entry({ id: res.data });
      }
    });
  }

  entry(item: any) {
    this.router.navigate(['/report/entry', item.id]);
  }

  reset() { this.filter = new ReportDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
