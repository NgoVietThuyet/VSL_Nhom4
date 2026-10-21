import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmLeaveService, HrmMasterDataService } from '../../services';
import { HrmLeaveRequestDto, HrmLeaveTypeDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-hrm-leave',
  imports: [SharedModules],
  templateUrl: './hrm-leave.html',
  styleUrls: ['./hrm-leave.scss']
})
export class HrmLeave implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: PaginationResult = new PaginationResult();
  filter: HrmLeaveRequestDto = new HrmLeaveRequestDto();
  statuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'PENDING', label: 'Chờ duyệt', color: 'processing' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' },
    { value: 'CANCELLED', label: 'Đã huỷ', color: 'default' }
  ];

  // Approval drawer
  approveVisible = false;
  selectedItem: any = null;
  selectedLeaveTypeCode = '';
  leaveTypes: HrmLeaveTypeDto[] = [];

  // Details drawer
  detailVisible = false;
  selectedDetailItem: any = null;

  constructor(
    private global: GlobalService,
    private service: HrmLeaveService,
    private mdSvc: HrmMasterDataService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Quản lý nghỉ phép', path: 'hrm/leave' }]);
  }

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.search();
  }

  loadLeaveTypes() {
    this.mdSvc.getAllLeaveTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.leaveTypes = res || []; }
    });
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

  cancel(item: any) {
    this.service.cancel(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.message.success('Đã huỷ đơn'); this.search(); } });
  }

  // --- Details flow ---
  viewDetail(item: any) {
    this.selectedDetailItem = item;
    this.detailVisible = true;
  }

  closeDetail() {
    this.detailVisible = false;
    this.selectedDetailItem = null;
  }

  // --- Approval flow ---
  openApprove(item: any) {
    this.selectedItem = item;
    this.selectedLeaveTypeCode = item.leaveTypeCode || '';
    this.approveVisible = true;
  }

  closeApprove() {
    this.approveVisible = false;
    this.selectedItem = null;
    this.selectedLeaveTypeCode = '';
  }

  confirmApprove() {
    if (!this.selectedLeaveTypeCode) {
      this.message.warning('Vui lòng chọn loại nghỉ phép trước khi duyệt');
      return;
    }
    this.service.approve(this.selectedItem.id, this.selectedLeaveTypeCode).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Đã duyệt đơn nghỉ phép');
        this.search();
        this.closeApprove();
      }
    });
  }

  reset() { this.filter = new HrmLeaveRequestDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
