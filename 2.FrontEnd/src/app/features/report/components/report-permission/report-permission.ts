import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { ReportPermissionService } from '../../services/report-permission.service';
import { ReportDefinitionService } from '../../services/report-definition.service';
import { CommonService } from '../../../../shared/services';
import { ReportPermissionDto } from '../../models/report.model';

@Component({
  selector: 'app-report-permission',
  imports: [SharedModules],
  templateUrl: './report-permission.html'
})
export class ReportPermission implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  definitions: any[] = [];
  accountGroups: any[] = [];
  accounts: any[] = [];
  selectedDefinition = '';
  permissions: ReportPermissionDto[] = [];
  visible = false;
  isEdit = false;
  dto: ReportPermissionDto = new ReportPermissionDto();

  constructor(
    private global: GlobalService,
    private service: ReportPermissionService,
    private definitionSrv: ReportDefinitionService,
    private commonSrv: CommonService
  ) {
    this.global.setBreadcrumb([{ name: 'Phân quyền báo cáo', path: 'report/permission' }]);
  }

  ngOnInit(): void {
    this.definitionSrv.getAll().pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.definitions = r || [] });
    this.commonSrv.get('AccountGroup/GetAll', {}).pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.accountGroups = r || [] });
    this.commonSrv.get('Account/GetAll', {}).pipe(takeUntil(this.destroy$)).subscribe({ next: (r: any) => this.accounts = r || [] });
  }

  load() {
    if (!this.selectedDefinition) { this.permissions = []; return; }
    this.service.byDefinition(this.selectedDefinition).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => this.permissions = r || []
    });
  }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.dto = { ...new ReportPermissionDto(), ...item };
    } else {
      this.dto = new ReportPermissionDto();
      this.dto.definitionId = this.selectedDefinition;
      this.dto.canView = true;
      this.dto.isActive = true;
    }
    this.visible = true;
  }

  close() { this.visible = false; }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visible = false; this.load(); }
    });
  }

  delete(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.load() });
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
