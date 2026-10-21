import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { HrmEmployeeService } from '../../services';

@Component({
  selector: 'app-hrm-org-chart',
  imports: [SharedModules],
  templateUrl: './hrm-org-chart.html',
  styleUrls: ['./hrm-org-chart.scss']
})
export class HrmOrgChart implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  nodes: any[] = [];

  constructor(private global: GlobalService, private service: HrmEmployeeService) {
    this.global.setBreadcrumb([{ name: 'Cây tổ chức', path: 'hrm/org-chart' }]);
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.service.orgTree().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.nodes = res || []; }
    });
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
