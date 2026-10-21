import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstMaintenanceService, AstAssetService } from '../../services';
import { AstMaintenanceDto, AstAssetDto } from '../../models';

@Component({
  selector: 'app-ast-maintenance',
  imports: [SharedModules],
  templateUrl: './ast-maintenance.html'
})
export class AstMaintenance implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  visibleComplete = false;
  data: PaginationResult = new PaginationResult();
  dto: AstMaintenanceDto = new AstMaintenanceDto();
  completeDto: AstMaintenanceDto = new AstMaintenanceDto();
  filter: AstMaintenanceDto = new AstMaintenanceDto();
  assetOptions: AstAssetDto[] = [];
  types = [
    { value: 'PREVENTIVE', label: 'Bảo trì định kỳ' },
    { value: 'CORRECTIVE', label: 'Sửa chữa' },
    { value: 'UPGRADE', label: 'Nâng cấp' }
  ];
  statuses = [
    { value: 'SCHEDULED', label: 'Đã lên lịch', color: 'orange' },
    { value: 'IN_PROGRESS', label: 'Đang thực hiện', color: 'blue' },
    { value: 'COMPLETED', label: 'Hoàn tất', color: 'green' },
    { value: 'CANCELLED', label: 'Huỷ', color: 'default' }
  ];

  constructor(private global: GlobalService, private service: AstMaintenanceService, private assetSvc: AstAssetService) {
    this.global.setBreadcrumb([{ name: 'Bảo trì - Sửa chữa', path: 'asset/maintenance' }]);
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
    this.dto = new AstMaintenanceDto();
    this.dto.scheduledDate = new Date().toISOString();
    const f = new AstAssetDto(); f.pageSize = 500;
    this.assetSvc.search(f).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.assetOptions = res?.data || [] });
    this.visible = true;
  }

  close() { this.visible = false; }

  save() {
    this.service.schedule(this.dto).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.visible = false; this.search(); } });
  }

  openComplete(item: any) {
    this.completeDto = { ...item, completedDate: new Date().toISOString() } as AstMaintenanceDto;
    this.visibleComplete = true;
  }
  closeComplete() { this.visibleComplete = false; }

  complete() {
    this.service.complete(this.completeDto.id, this.completeDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visibleComplete = false; this.search(); }
    });
  }

  reset() { this.filter = new AstMaintenanceDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
