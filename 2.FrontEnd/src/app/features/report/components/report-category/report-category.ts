import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { ReportCategoryService } from '../../services/report-category.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportCategoryDto } from '../../models/report-category.model';

@Component({
  selector: 'app-report-category',
  imports: [SharedModules],
  templateUrl: './report-category.html'
})
export class ReportCategory implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: ReportCategoryDto = new ReportCategoryDto();
  filter: ReportCategoryDto = new ReportCategoryDto();
  parents: any[] = [];

  constructor(private global: GlobalService, private service: ReportCategoryService) {
    this.global.setBreadcrumb([{ name: 'Loại báo cáo', path: 'report/category' }]);
  }

  ngOnInit(): void { this.search(); this.loadParents(); }

  loadParents() {
    this.service.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.parents = res || []; }
    });
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

  trackById(_: number, item: any) { return item.code; }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new ReportCategoryDto();
    }
  }

  close() { this.visible = false; this.dto = new ReportCategoryDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); this.loadParents(); if (!this.isEdit) this.dto = new ReportCategoryDto(); }
    });
  }

  reset() { this.filter = new ReportCategoryDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
