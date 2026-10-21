import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstDisposalService, AstAssetService } from '../../services';
import { AstDisposalDto, AstAssetDto } from '../../models';

@Component({
  selector: 'app-ast-disposal',
  imports: [SharedModules],
  templateUrl: './ast-disposal.html'
})
export class AstDisposal implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  data: PaginationResult = new PaginationResult();
  filter: AstDisposalDto = new AstDisposalDto();
  dto: AstDisposalDto = new AstDisposalDto();
  assetOptions: AstAssetDto[] = [];
  types = [
    { value: 'LIQUIDATE', label: 'Thanh lý' },
    { value: 'WRITE_OFF', label: 'Ghi giảm' },
    { value: 'DONATE', label: 'Tặng / cho' },
    { value: 'LOST', label: 'Mất' }
  ];
  statuses = [
    { value: 'PENDING', label: 'Chờ duyệt', color: 'orange' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' }
  ];

  constructor(private global: GlobalService, private service: AstDisposalService, private assetSvc: AstAssetService) {
    this.global.setBreadcrumb([{ name: 'Thanh lý tài sản', path: 'asset/disposal' }]);
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
    this.dto = new AstDisposalDto();
    this.dto.disposalDate = new Date().toISOString();
    const f = new AstAssetDto(); f.pageSize = 500;
    this.assetSvc.search(f).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.assetOptions = res?.data || [] });
    this.visible = true;
  }
  close() { this.visible = false; }

  save() {
    this.service.submit(this.dto).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.visible = false; this.search(); } });
  }

  approve(item: any) {
    this.service.approve(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reject(item: any) {
    this.service.reject(item.id, { ...item, note: 'Từ chối' } as AstDisposalDto).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstDisposalDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
