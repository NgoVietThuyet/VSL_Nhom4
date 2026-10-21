import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstCategoryService } from '../../services';
import { AstCategoryDto } from '../../models';

@Component({
  selector: 'app-ast-category',
  imports: [SharedModules],
  templateUrl: './ast-category.html'
})
export class AstCategory implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: AstCategoryDto = new AstCategoryDto();
  filter: AstCategoryDto = new AstCategoryDto();
  methods = [{ value: 'STRAIGHT', label: 'Đường thẳng' }, { value: 'DECLINING', label: 'Số dư giảm' }];
  types = [{ value: 'TSCD', label: 'Tài sản cố định' }, { value: 'CCDC', label: 'Công cụ dụng cụ' }, { value: 'SOFTWARE', label: 'Phần mềm' }, { value: 'VEHICLE', label: 'Xe cộ' }];

  constructor(private global: GlobalService, private service: AstCategoryService) {
    this.global.setBreadcrumb([{ name: 'Loại tài sản', path: 'asset/category' }]);
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

  trackById(_: number, item: any) { return item.id; }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new AstCategoryDto();
    }
  }

  close() { this.visible = false; this.dto = new AstCategoryDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new AstCategoryDto(); }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstCategoryDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
