import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstAssetService, AstCategoryService } from '../../services';
import { AstAssetDto, AstCategoryDto } from '../../models';

@Component({
  selector: 'app-ast-asset',
  imports: [SharedModules],
  templateUrl: './ast-asset.html'
})
export class AstAsset implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: AstAssetDto = new AstAssetDto();
  filter: AstAssetDto = new AstAssetDto();
  categories: AstCategoryDto[] = [];
  statuses = [
    { value: 'AVAILABLE', label: 'Sẵn sàng', color: 'green' },
    { value: 'IN_USE', label: 'Đang sử dụng', color: 'blue' },
    { value: 'MAINTENANCE', label: 'Bảo trì', color: 'orange' },
    { value: 'BROKEN', label: 'Hỏng', color: 'red' },
    { value: 'DISPOSED', label: 'Đã thanh lý', color: 'default' }
  ];
  methods = [{ value: 'STRAIGHT', label: 'Đường thẳng' }, { value: 'DECLINING', label: 'Số dư giảm' }];

  constructor(private global: GlobalService, private service: AstAssetService, private catSvc: AstCategoryService, private router: Router) {
    this.global.setBreadcrumb([{ name: 'Danh sách tài sản', path: 'asset/asset' }]);
  }

  ngOnInit(): void { this.loadCategories(); this.search(); }

  loadCategories() {
    this.catSvc.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.categories = res || [] });
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }

  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  goDetail(item: any) { this.router.navigate(['/asset/asset/detail', item.id]); }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res?.info || res; this.visible = true; }
      });
    } else {
      this.dto = new AstAssetDto();
      this.service.nextCode().pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto.code = res; this.dto.barcode = `AST-${res}`; this.visible = true; }
      });
    }
  }

  close() { this.visible = false; this.dto = new AstAssetDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new AstAssetDto(); }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstAssetDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
