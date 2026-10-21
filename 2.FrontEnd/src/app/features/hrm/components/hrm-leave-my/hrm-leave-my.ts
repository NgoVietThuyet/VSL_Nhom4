import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmLeaveService } from '../../services';
import { HrmLeaveRequestDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-hrm-leave-my',
  imports: [SharedModules],
  templateUrl: './hrm-leave-my.html'
})
export class HrmLeaveMy implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  data: PaginationResult = new PaginationResult();
  filter: HrmLeaveRequestDto = new HrmLeaveRequestDto();
  dto: HrmLeaveRequestDto = new HrmLeaveRequestDto();
  statuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'PENDING', label: 'Chờ duyệt', color: 'processing' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' },
    { value: 'CANCELLED', label: 'Đã huỷ', color: 'default' }
  ];

  // Details drawer
  detailVisible = false;
  selectedDetailItem: any = null;

  constructor(
    private global: GlobalService,
    private service: HrmLeaveService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Đơn nghỉ của tôi', path: 'hrm/leave/my' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.myRequests(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res || new PaginationResult(); }
    });
  }

  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }
  trackById(_: number, item: any) { return item.id; }

  viewDetail(item: any) {
    this.selectedDetailItem = item;
    this.detailVisible = true;
  }

  closeDetail() {
    this.detailVisible = false;
    this.selectedDetailItem = null;
  }

  openNew() {
    this.dto = new HrmLeaveRequestDto();
    this.visible = true;
  }

  close() { this.visible = false; this.dto = new HrmLeaveRequestDto(); }

  /** Auto-calculate TotalDays when dates change */
  onDateChange() {
    if (this.dto.fromDate && this.dto.toDate) {
      const from = new Date(this.dto.fromDate);
      const to = new Date(this.dto.toDate);
      const diff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      this.dto.totalDays = diff > 0 ? diff : 0;
    } else {
      this.dto.totalDays = 0;
    }
  }

  submit() {
    if (!this.dto.fromDate || !this.dto.toDate || !this.dto.reason) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    this.service.submit(this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Đã gửi đơn nghỉ phép');
        this.search();
        this.close();
      }
    });
  }

  cancel(item: any) {
    this.service.cancel(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.message.success('Đã huỷ đơn');
        this.search();
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