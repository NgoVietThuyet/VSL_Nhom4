import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { HrmEmployeeService, HrmContractService, HrmAttendanceService, HrmLeaveService, HrmPayrollService } from '../../services';

@Component({
  selector: 'app-hrm-employee-detail',
  imports: [SharedModules],
  templateUrl: './hrm-employee-detail.html',
  styleUrls: ['./hrm-employee-detail.scss']
})
export class HrmEmployeeDetail implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  id: string = '';
  info: any = {};
  contracts: any[] = [];
  attendances: any[] = [];
  leaves: any[] = [];
  payslips: any[] = [];
  contacts: any[] = [];
  documents: any[] = [];
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  constructor(
    private global: GlobalService, private empSvc: HrmEmployeeService,
    private contractSvc: HrmContractService, private attendanceSvc: HrmAttendanceService,
    private leaveSvc: HrmLeaveService, private payrollSvc: HrmPayrollService,
    private route: ActivatedRoute
  ) {
    this.global.setBreadcrumb([{ name: 'Chi tiết nhân viên', path: '' }]);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (this.id) this.load();
  }

  load() {
    this.empSvc.detail(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.info = res?.info || res || {}; }
    });
    this.contractSvc.byEmployee(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.contracts = res || []; }
    });
    this.empSvc.contacts(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.contacts = res || []; }
    });
    this.empSvc.documents(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.documents = res || []; }
    });
  }

  loadAttendance() {
    this.attendanceSvc.summary(this.id, this.currentYear, this.currentMonth).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.attendances = res?.details || res || []; }
    });
  }

  loadLeaves() {
    this.leaveSvc.balance(this.id, this.currentYear).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.leaves = res || []; }
    });
  }

  onTabChange(index: number) {
    if (index === 2 && this.attendances.length === 0) this.loadAttendance();
    if (index === 3 && this.leaves.length === 0) this.loadLeaves();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
