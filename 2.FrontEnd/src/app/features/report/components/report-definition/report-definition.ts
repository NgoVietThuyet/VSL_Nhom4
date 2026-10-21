import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { ReportDefinitionService } from '../../services/report-definition.service';
import { ReportCategoryService } from '../../services/report-category.service';
import { ReportPeriodTypeService } from '../../services/report-period-type.service';
import { ReportStatusService } from '../../services/report-status.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { ReportDefinitionDto } from '../../models/report-definition.model';

@Component({
  selector: 'app-report-definition',
  imports: [SharedModules],
  templateUrl: './report-definition.html'
})
export class ReportDefinition implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: ReportDefinitionDto = new ReportDefinitionDto();
  filter: ReportDefinitionDto = new ReportDefinitionDto();
  categories: any[] = [];
  periodTypes: any[] = [];
  statuses: any[] = [];

  constructor(
    private global: GlobalService,
    private router: Router,
    private service: ReportDefinitionService,
    private categorySrv: ReportCategoryService,
    private periodTypeSrv: ReportPeriodTypeService,
    private statusSrv: ReportStatusService
  ) {
    this.global.setBreadcrumb([{ name: 'Định nghĩa báo cáo', path: 'report/definition' }]);
  }

  ngOnInit(): void {
    this.search();
    this.categorySrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.categories = r || [] });
    this.periodTypeSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.periodTypes = r || [] });
    this.statusSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.statuses = r || [] });
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

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new ReportDefinitionDto();
    }
  }

  close() { this.visible = false; this.dto = new ReportDefinitionDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new ReportDefinitionDto(); }
    });
  }

  designer(item: any) {
    this.router.navigate(['/report/designer', item.id]);
  }

  reset() { this.filter = new ReportDefinitionDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
