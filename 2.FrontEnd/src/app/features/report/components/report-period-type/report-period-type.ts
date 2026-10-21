import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { ReportPeriodTypeService } from '../../services/report-period-type.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportPeriodTypeDto } from '../../models/report-period-type.model';

@Component({
  selector: 'app-report-period-type',
  imports: [SharedModules],
  templateUrl: './report-period-type.html'
})
export class ReportPeriodType implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: ReportPeriodTypeDto = new ReportPeriodTypeDto();
  filter: ReportPeriodTypeDto = new ReportPeriodTypeDto();

  constructor(private global: GlobalService, private service: ReportPeriodTypeService) {
    this.global.setBreadcrumb([{ name: 'Loại kỳ báo cáo', path: 'report/period-type' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res; }
    });
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
      this.dto = new ReportPeriodTypeDto();
    }
  }

  close() { this.visible = false; this.dto = new ReportPeriodTypeDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new ReportPeriodTypeDto(); }
    });
  }

  reset() { this.filter = new ReportPeriodTypeDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
