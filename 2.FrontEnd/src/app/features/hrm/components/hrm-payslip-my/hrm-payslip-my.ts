import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmPayrollService } from '../../services';
import { HrmPayslipDto } from '../../models';

@Component({
  selector: 'app-hrm-payslip-my',
  imports: [SharedModules],
  templateUrl: './hrm-payslip-my.html'
})
export class HrmPayslipMy implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  records: PaginationResult = new PaginationResult();
  filter: HrmPayslipDto = new HrmPayslipDto();
  selectedPayslip: any = null;

  constructor(private global: GlobalService, private service: HrmPayrollService) {
    this.global.setBreadcrumb([{ name: 'Phiếu lương của tôi', path: 'hrm/payroll/my-payslips' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.myPayslips(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.records = res; }
    });
  }

  onPageChange(index: number) {
    this.filter.currentPage = index;
    this.search();
  }

  viewDetail(item: any) {
    this.service.myPayslip(item.periodId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.selectedPayslip = res; }
    });
  }

  closeDetail() { this.selectedPayslip = null; }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
