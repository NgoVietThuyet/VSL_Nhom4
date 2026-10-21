import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { ReportUnitService } from '../../services/report-unit.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportUnitDto } from '../../models/report-unit.model';

@Component({
  selector: 'app-report-unit',
  imports: [SharedModules],
  templateUrl: './report-unit.html'
})
export class ReportUnit implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: ReportUnitDto = new ReportUnitDto();
  filter: ReportUnitDto = new ReportUnitDto();

  constructor(private global: GlobalService, private service: ReportUnitService) {
    this.global.setBreadcrumb([{ name: 'Đơn vị tính báo cáo', path: 'report/unit' }]);
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
      this.dto = new ReportUnitDto();
    }
  }

  close() { this.visible = false; this.dto = new ReportUnitDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    (this.service as any)[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new ReportUnitDto(); }
    });
  }

  reset() { this.filter = new ReportUnitDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
