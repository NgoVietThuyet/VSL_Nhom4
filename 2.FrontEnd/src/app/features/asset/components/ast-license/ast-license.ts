import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstLicenseService } from '../../services';
import { AstLicenseDto } from '../../models';

@Component({
  selector: 'app-ast-license',
  imports: [SharedModules],
  templateUrl: './ast-license.html'
})
export class AstLicense implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  filter: AstLicenseDto = new AstLicenseDto();
  dto: AstLicenseDto = new AstLicenseDto();
  types = [
    { value: 'SUBSCRIPTION', label: 'Subscription' },
    { value: 'PERPETUAL', label: 'Perpetual' },
    { value: 'OEM', label: 'OEM' }
  ];
  statuses = [
    { value: 'ACTIVE', label: 'Đang hiệu lực', color: 'green' },
    { value: 'EXPIRED', label: 'Hết hạn', color: 'red' },
    { value: 'CANCELLED', label: 'Huỷ', color: 'default' }
  ];

  constructor(private global: GlobalService, private service: AstLicenseService) {
    this.global.setBreadcrumb([{ name: 'License - Bản quyền', path: 'asset/license' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.dto = new AstLicenseDto();
      this.visible = true;
    }
  }
  close() { this.visible = false; }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visible = false; this.search(); }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstLicenseDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
