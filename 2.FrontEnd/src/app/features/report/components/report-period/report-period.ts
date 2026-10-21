import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { ReportPeriodService } from '../../services/report-period.service';
import { ReportPeriodTypeService } from '../../services/report-period-type.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportPeriodDto } from '../../models/report-period.model';

@Component({
  selector: 'app-report-period',
  imports: [SharedModules],
  templateUrl: './report-period.html'
})
export class ReportPeriod implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: ReportPeriodDto = new ReportPeriodDto();
  filter: ReportPeriodDto = new ReportPeriodDto();
  filterYear: number | null = null;
  filterPeriodTypeCode: string = '';
  periodTypes: any[] = [];
  years: number[] = [];

  constructor(
    private global: GlobalService,
    private service: ReportPeriodService,
    private periodTypeSrv: ReportPeriodTypeService
  ) {
    this.global.setBreadcrumb([{ name: 'Kỳ báo cáo', path: 'report/period' }]);
  }

  ngOnInit(): void {
    this.generateYearRange();
    this.search();
    this.periodTypeSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.periodTypes = res || []; }
    });
  }

  search() {
    this.filter.year = this.filterYear;
    this.filter.periodTypeCode = this.filterPeriodTypeCode;
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res; }
    });
  }

  generateYearRange(): void {
    const currentYear = new Date().getFullYear();
    this.years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.code; }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new ReportPeriodDto();
    }
  }

  close() { this.visible = false; this.dto = new ReportPeriodDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new ReportPeriodDto(); }
    });
  }

  reset() { 
    this.filter = new ReportPeriodDto(); 
    this.filterYear = null;
    this.filterPeriodTypeCode = '';
    this.search(); 
  }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
