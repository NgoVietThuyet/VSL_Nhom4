import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstAssignmentService, AstAssetService } from '../../services';
import { AstAssignmentDto, AstAssetDto } from '../../models';

@Component({
  selector: 'app-ast-assignment',
  imports: [SharedModules],
  templateUrl: './ast-assignment.html'
})
export class AstAssignment implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  visibleReturn = false;
  data: PaginationResult = new PaginationResult();
  dto: AstAssignmentDto = new AstAssignmentDto();
  filter: AstAssignmentDto = new AstAssignmentDto();
  returnDto: AstAssignmentDto = new AstAssignmentDto();
  assetOptions: AstAssetDto[] = [];
  statuses = [
    { value: 'ACTIVE', label: 'Đang sử dụng', color: 'blue' },
    { value: 'RETURNED', label: 'Đã thu hồi', color: 'default' }
  ];
  conditions = [
    { value: 'GOOD', label: 'Tốt' },
    { value: 'FAIR', label: 'Bình thường' },
    { value: 'BROKEN', label: 'Hỏng' }
  ];

  constructor(private global: GlobalService, private service: AstAssignmentService, private assetSvc: AstAssetService) {
    this.global.setBreadcrumb([{ name: 'Cấp phát tài sản', path: 'asset/assignment' }]);
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

  loadAvailable() {
    const f = new AstAssetDto();
    f.statusFilter = 'AVAILABLE';
    f.pageSize = 200;
    this.assetSvc.search(f).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.assetOptions = res?.data || [] });
  }

  open() {
    this.dto = new AstAssignmentDto();
    this.dto.assignedDate = new Date().toISOString();
    this.loadAvailable();
    this.visible = true;
  }

  close() { this.visible = false; }

  assign() {
    this.service.assign(this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visible = false; this.search(); }
    });
  }

  openReturn(item: any) {
    this.returnDto = { ...item, returnCondition: 'GOOD' } as AstAssignmentDto;
    this.visibleReturn = true;
  }

  closeReturn() { this.visibleReturn = false; }

  doReturn() {
    this.service.return(this.returnDto.id, this.returnDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visibleReturn = false; this.search(); }
    });
  }

  reset() { this.filter = new AstAssignmentDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
