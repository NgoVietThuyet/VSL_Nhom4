import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfCategoryService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { WfProcessCategoryDto } from '../../models';

@Component({
  selector: 'app-wf-category',
  imports: [SharedModules],
  templateUrl: './wf-category.html'
})
export class WfCategory implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: WfProcessCategoryDto = new WfProcessCategoryDto();
  filter: WfProcessCategoryDto = new WfProcessCategoryDto();

  constructor(private global: GlobalService, private service: WfCategoryService) {
    this.global.setBreadcrumb([{ name: 'Loại quy trình', path: 'workflow/category' }]);
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
      this.dto = new WfProcessCategoryDto();
    }
  }

  close() { this.visible = false; this.dto = new WfProcessCategoryDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new WfProcessCategoryDto(); }
    });
  }

  remove(item: any) {
    this.service.delete(item.code).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new WfProcessCategoryDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
