import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstTransferService, AstAssetService } from '../../services';
import { AstTransferDto, AstAssetDto } from '../../models';

@Component({
  selector: 'app-ast-transfer',
  imports: [SharedModules],
  templateUrl: './ast-transfer.html'
})
export class AstTransfer implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  data: PaginationResult = new PaginationResult();
  dto: AstTransferDto = new AstTransferDto();
  filter: AstTransferDto = new AstTransferDto();
  assetOptions: AstAssetDto[] = [];
  statuses = [
    { value: 'PENDING', label: 'Chờ duyệt', color: 'orange' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' }
  ];

  constructor(private global: GlobalService, private service: AstTransferService, private assetSvc: AstAssetService) {
    this.global.setBreadcrumb([{ name: 'Điều chuyển tài sản', path: 'asset/transfer' }]);
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

  open() {
    this.dto = new AstTransferDto();
    this.dto.transferDate = new Date().toISOString();
    const f = new AstAssetDto(); f.pageSize = 500;
    this.assetSvc.search(f).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.assetOptions = res?.data || [] });
    this.visible = true;
  }

  close() { this.visible = false; }

  save() {
    this.service.insert(this.dto).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.visible = false; this.search(); } });
  }

  approve(item: any) {
    this.service.approve(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reject(item: any) {
    this.service.reject(item.id, { ...item, note: item.note || 'Từ chối' } as AstTransferDto)
      .pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstTransferDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
