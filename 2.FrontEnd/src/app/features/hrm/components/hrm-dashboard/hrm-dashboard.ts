import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { HrmEmployeeService, HrmContractService } from '../../services';
import { HrmDashboardSummaryDto } from '../../models';

@Component({
  selector: 'app-hrm-dashboard',
  imports: [SharedModules],
  templateUrl: './hrm-dashboard.html',
  styleUrls: ['./hrm-dashboard.scss']
})
export class HrmDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  summary: HrmDashboardSummaryDto = new HrmDashboardSummaryDto();
  expiringContracts: any[] = [];

  constructor(private global: GlobalService, private empSvc: HrmEmployeeService, private contractSvc: HrmContractService) {
    this.global.setBreadcrumb([{ name: 'Tổng quan nhân sự', path: 'hrm/dashboard' }]);
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.empSvc.dashboard().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.summary = res || new HrmDashboardSummaryDto(); }
    });
    this.contractSvc.expiring().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.expiringContracts = res || []; }
    });
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
