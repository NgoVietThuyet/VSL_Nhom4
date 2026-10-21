import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmAttendanceService } from '../../services';
import { HrmAttendanceDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-hrm-attendance-my',
  imports: [SharedModules, NzResultModule],
  templateUrl: './hrm-attendance-my.html'
})
export class HrmAttendanceMy implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: PaginationResult = new PaginationResult();
  filter: HrmAttendanceDto = new HrmAttendanceDto();
  filterDate: Date | null = new Date();
  todayRecord: any = null;
  visibleRequest = false;
  requestDto: HrmAttendanceDto = new HrmAttendanceDto();
  noEmployeeProfile = false;
  statuses = [
    { value: 'PRESENT', label: 'Có mặt', color: 'green' },
    { value: 'ABSENT', label: 'Vắng', color: 'red' },
    { value: 'LEAVE', label: 'Nghỉ phép', color: 'blue' },
    { value: 'HOLIDAY', label: 'Lễ', color: 'purple' },
    { value: 'WEEKEND', label: 'Cuối tuần', color: 'default' },
    { value: 'HALF', label: 'Nửa ngày', color: 'orange' },
    { value: 'REQUESTED', label: 'Chờ duyệt', color: 'warning' }
  ];

  constructor(private global: GlobalService, private service: HrmAttendanceService, private message: NzMessageService) {
    this.global.setBreadcrumb([{ name: 'Chấm công của tôi', path: 'hrm/attendance/my' }]);
    this.filter.yearFilter = new Date().getFullYear();
    this.filter.monthFilter = new Date().getMonth() + 1;
  }

  ngOnInit(): void { this.search(); }

  search() {
    if (this.filterDate) {
      const d = new Date(this.filterDate);
      d.setHours(0, 0, 0, 0);
      this.filter.dateFilter = d;
      this.filter.yearFilter = d.getFullYear();
      this.filter.monthFilter = d.getMonth() + 1;
    } else {
      this.filter.dateFilter = null;
    }
    this.service.myAttendance(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res || new PaginationResult();
        // If total is 0 and no filter applied, likely no employee profile linked
        if (this.data.totalRecord === 0 && !this.filter.dateFilter) {
          this.noEmployeeProfile = true;
        } else {
          this.noEmployeeProfile = false;
        }
        this.findTodayRecord();
      },
      error: () => {
        this.data = new PaginationResult();
        this.noEmployeeProfile = true;
      }
    });
  }

  onFilterDateChange(date: Date) {
    if (date) {
      this.filter.dateFilter = date;
      this.filter.yearFilter = date.getFullYear();
      this.filter.monthFilter = date.getMonth() + 1;
    } else {
      this.filter.dateFilter = null;
      this.filter.yearFilter = null;
      this.filter.monthFilter = null;
    }
    this.search();
  }

  openRequest() {
    this.requestDto = new HrmAttendanceDto();
    this.requestDto.workDate = new Date();
    this.requestDto.status = 'REQUESTED';
    this.requestDto.source = 'WEB';
    // Use employeeId from todayRecord or first record if available
    if (this.todayRecord) {
      this.requestDto.employeeId = this.todayRecord.employeeId;
    } else if (this.data.data.length > 0) {
      this.requestDto.employeeId = this.data.data[0].employeeId;
    }
    this.visibleRequest = true;
  }

  closeRequest() {
    this.visibleRequest = false;
  }

  submitRequest() {
    if (!this.requestDto.workDate || !this.requestDto.checkIn) {
      this.message.error('Vui lòng chọn ngày và giờ vào');
      return;
    }

    // Normalize date portion of checkIn and checkOut to match workDate
    const workDate = new Date(this.requestDto.workDate);
    
    if (this.requestDto.checkIn) {
      const checkIn = new Date(this.requestDto.checkIn);
      checkIn.setFullYear(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
      this.requestDto.checkIn = checkIn;
    }
    
    if (this.requestDto.checkOut) {
      const checkOut = new Date(this.requestDto.checkOut);
      checkOut.setFullYear(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
      this.requestDto.checkOut = checkOut;
    }

    this.service.adjust(this.requestDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.message.success('Đã gửi yêu cầu chấm công bù!');
          this.closeRequest();
          this.search();
        }
      }
    });
  }

  todayRecords: any[] = [];
  latestTodayRecord: any = null;

  findTodayRecord() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = this.data?.data || [];
    
    this.todayRecords = records.filter((r: any) => {
      if (!r.workDate) return false;
      const d = new Date(r.workDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    // Sort todayRecords by checkIn ascending so the latest check-in is the last element
    this.todayRecords.sort((a, b) => {
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return timeA - timeB;
    });

    this.latestTodayRecord = this.todayRecords.length > 0 ? this.todayRecords[this.todayRecords.length - 1] : null;
    this.todayRecord = this.latestTodayRecord;
  }

  get hasActiveCheckIn(): boolean {
    return !!this.latestTodayRecord && !!this.latestTodayRecord.checkIn && !this.latestTodayRecord.checkOut;
  }

  checkin() {
    this.service.checkin({}).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
        }
        this.search();
      }
    });
  }

  checkout() {
    this.service.checkout({}).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
        }
        this.search();
      },
      error: () => this.search()
    });
  }

  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }
  trackById(_: number, item: any) { return item.id; }

  formatWorkHours(hours: number | null | undefined): string {
    if (hours == null || isNaN(hours)) return '';
    const totalMinutes = Math.round(hours * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  reset() { this.filter = new HrmAttendanceDto(); this.filter.yearFilter = new Date().getFullYear(); this.filter.monthFilter = new Date().getMonth() + 1; this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
