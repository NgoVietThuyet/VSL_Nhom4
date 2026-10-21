import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstInventoryService } from '../../services';
import { AstInventoryCountDto, AstInventoryCountLineDto, AstInventoryScanRequestDto } from '../../models';

@Component({
  selector: 'app-ast-inventory',
  imports: [SharedModules],
  templateUrl: './ast-inventory.html'
})
export class AstInventory implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  visibleScan = false;
  data: PaginationResult = new PaginationResult();
  filter: AstInventoryCountDto = new AstInventoryCountDto();
  dto: AstInventoryCountDto = new AstInventoryCountDto();
  scanDto: AstInventoryScanRequestDto = new AstInventoryScanRequestDto();
  selectedCount: AstInventoryCountDto = new AstInventoryCountDto();
  lines: PaginationResult = new PaginationResult();
  linesFilter: AstInventoryCountLineDto = new AstInventoryCountLineDto();
  statuses = [
    { value: 'DRAFT', label: 'Khởi tạo', color: 'default' },
    { value: 'IN_PROGRESS', label: 'Đang kiểm', color: 'blue' },
    { value: 'COMPLETED', label: 'Hoàn tất', color: 'green' }
  ];

  constructor(private global: GlobalService, private service: AstInventoryService) {
    this.global.setBreadcrumb([{ name: 'Kiểm kê', path: 'asset/inventory' }]);
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
    this.dto = new AstInventoryCountDto();
    this.dto.countDate = new Date().toISOString();
    this.visible = true;
  }
  close() { this.visible = false; }

  save() {
    this.service.insert(this.dto).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.visible = false; this.search(); } });
  }

  openScan(item: any) {
    this.selectedCount = item;
    this.scanDto = new AstInventoryScanRequestDto();
    this.scanDto.countId = item.id;
    this.linesFilter = new AstInventoryCountLineDto();
    this.linesFilter.countId = item.id;
    this.loadLines();
    this.visibleScan = true;
  }
  closeScan() { this.visibleScan = false; }

  loadLines() {
    this.service.lines(this.linesFilter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.lines = res });
  }

  doScan() {
    this.service.scan(this.scanDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.scanDto.barcode = ''; this.loadLines(); }
    });
  }

  complete(item: any) {
    this.service.complete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new AstInventoryCountDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
