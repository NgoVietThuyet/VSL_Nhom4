import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmAttendanceService } from '../../services';
import { HrmAttendanceDto } from '../../models';
import { OrganizeService } from '../../../master-data/services/organize.service';

@Component({
  selector: 'app-hrm-attendance',
  imports: [SharedModules],
  templateUrl: './hrm-attendance.html',
  styleUrls: ['./hrm-attendance.scss']
})
export class HrmAttendance implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmAttendanceDto = new HrmAttendanceDto();
  filter: HrmAttendanceDto = new HrmAttendanceDto();
  filterDate: Date | null = new Date();
  organizations: any[] = [];
  statuses = [
    { value: 'PRESENT', label: 'Có mặt', color: 'green' },
    { value: 'ABSENT', label: 'Vắng', color: 'red' },
    { value: 'LEAVE', label: 'Nghỉ phép', color: 'blue' },
    { value: 'HOLIDAY', label: 'Lễ', color: 'purple' },
    { value: 'WEEKEND', label: 'Cuối tuần', color: 'default' },
    { value: 'HALF', label: 'Nửa ngày', color: 'orange' },
    { value: 'REQUESTED', label: 'Chờ duyệt', color: 'warning' }
  ];

  constructor(
    private global: GlobalService, 
    private service: HrmAttendanceService,
    private organizeService: OrganizeService
  ) {
    this.global.setBreadcrumb([{ name: 'Chấm công', path: 'hrm/attendance' }]);
    this.filter.yearFilter = new Date().getFullYear();
    this.filter.monthFilter = new Date().getMonth() + 1;
  }

  ngOnInit(): void { 
    this.loadMasterData();
    this.search(); 
  }

  loadMasterData() {
    this.organizeService.search({ pageSize: 999 } as any).pipe(takeUntil(this.destroy$)).subscribe({ 
      next: (res: any) => this.organizations = res.data || [] 
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
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  formatWorkHours(hours: number | null | undefined): string {
    if (hours == null || isNaN(hours)) return '';
    const totalMinutes = Math.round(hours * 60);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  openAdjust(item: any) {
    this.dto = { ...new HrmAttendanceDto(), ...item };
    this.visible = true;
  }

  closeAdjust() { this.visible = false; this.dto = new HrmAttendanceDto(); }

  saveAdjust() {
    if (this.dto.workDate) {
      const workDate = new Date(this.dto.workDate);
      
      if (this.dto.checkIn) {
        const checkIn = new Date(this.dto.checkIn);
        checkIn.setFullYear(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
        this.dto.checkIn = checkIn;
      }
      
      if (this.dto.checkOut) {
        const checkOut = new Date(this.dto.checkOut);
        checkOut.setFullYear(workDate.getFullYear(), workDate.getMonth(), workDate.getDate());
        this.dto.checkOut = checkOut;
      }
    }

    this.service.adjust(this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.search();
          this.closeAdjust();
        }
      }
    });
  }

  approveRequest(item: any) {
    const payload = { ...item, status: 'PRESENT' };
    this.service.adjust(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) { this.search(); }
      }
    });
  }

  recalculate() {
    this.service.recalculate({ year: this.filter.yearFilter, month: this.filter.monthFilter }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.search()
    });
  }

  reset() { this.filter = new HrmAttendanceDto(); this.filter.yearFilter = new Date().getFullYear(); this.filter.monthFilter = new Date().getMonth() + 1; this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
