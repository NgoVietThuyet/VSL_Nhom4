import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmEmployeeService, HrmMasterDataService } from '../../services';
import { HrmEmployeeDto, HrmShiftDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AccountService } from '../../../system-manager/services/account.service';
import { OrganizeService } from '../../../master-data/services/organize.service';
import { TitleService } from '../../../master-data/services/title.service';
import { AccountDto } from '../../../system-manager/models';

@Component({
  selector: 'app-hrm-employee-list',
  imports: [SharedModules],
  templateUrl: './hrm-employee-list.html',
  styleUrls: ['./hrm-employee-list.scss']
})
export class HrmEmployeeList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private codeConfig$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmEmployeeDto = new HrmEmployeeDto();
  filter: HrmEmployeeDto = new HrmEmployeeDto();
  statuses = [
    { value: 'ACTIVE', label: 'Đang làm', color: 'green' },
    { value: 'ON_LEAVE', label: 'Tạm nghỉ', color: 'orange' },
    { value: 'RESIGNED', label: 'Đã nghỉ', color: 'default' },
    { value: 'TERMINATED', label: 'Sa thải', color: 'red' }
  ];
  genders = [{ value: 'M', label: 'Nam' }, { value: 'F', label: 'Nữ' }, { value: 'O', label: 'Khác' }];
  isSystemUser = false;
  accounts: any[] = [];
  organizes: any[] = [];
  titles: any[] = [];
  codeConfig = { prefix: 'NV', nextValue: '0001', length: 4, auto: true };
  codePreview = '';
  canEditConfig = false;
  shifts: HrmShiftDto[] = [];

  constructor(
    private global: GlobalService,
    private service: HrmEmployeeService,
    private router: Router,
    private message: NzMessageService,
    private accountService: AccountService,
    private organizeService: OrganizeService,
    private titleService: TitleService,
    private masterDataService: HrmMasterDataService
  ) {
    this.global.setBreadcrumb([{ name: 'Danh sách nhân viên', path: 'hrm/employee' }]);
  }

  ngOnInit(): void {
    this.canEditConfig = this.global.hasRight('R20.1.0');
    this.loadCodeConfig();

    this.codeConfig$.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => {
      if (!this.canEditConfig) return;
      
      this.service.saveCodeConfig(this.codeConfig).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.updatePreview(); }
      });
    });

    this.search();
    this.loadMasterData();
  }

  loadCodeConfig() {
    this.service.getCodeConfig().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res) {
          this.codeConfig = res;
          this.updatePreview();
        }
      }
    });
  }

  saveCodeConfig() {
    if (!this.canEditConfig) return;
    this.codeConfig$.next();
  }

  updatePreview() {
    this.codePreview = `${this.codeConfig.prefix}${this.codeConfig.nextValue}`;
  }

  generateCode() {
    if (!this.codeConfig.auto) return;
    this.service.getCodeConfig().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res) {
          this.codeConfig = res;
          this.updatePreview();
          this.dto.employeeCode = `${this.codeConfig.prefix}${this.codeConfig.nextValue}`;
        }
      }
    });
  }

  loadMasterData() {
    this.organizeService.search({ pageSize: 999 } as any).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.organizes = res.data || [] });
    this.titleService.search({ pageSize: 999 } as any).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.titles = res.data || [] });
    this.masterDataService.getAllShifts().pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.shifts = res?.data || res || [] });
  }

  searchAccounts(value: string): void {
    const filter = new AccountDto();
    filter.keyWord = value;
    filter.pageSize = 20;
    this.accountService.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.accounts = res.data || []; }
    });
  }

  onAccountChange(userName: string) {
    const acc = this.accounts.find(x => x.userName === userName);
    if (acc) {
      this.dto.userName = acc.userName;
      this.dto.fullName = acc.fullName;
      this.dto.email = acc.email;
      this.dto.phone = acc.phone;
      this.dto.organizeId = acc.orgId;
      this.dto.titleId = acc.titleCode;
    }
  }

  onSystemUserModeChange(val: boolean) {
    if (val && this.accounts.length === 0) {
      this.searchAccounts('');
    }
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
  goDetail(item: any) { this.router.navigate(['/hrm/employee', item.id]); }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res?.info || res; this.visible = true; }
      });
    } else {
      this.dto = new HrmEmployeeDto();
      this.isSystemUser = false;
      this.generateCode();
      this.visible = true;
    }
  }

  close() { this.visible = false; this.dto = new HrmEmployeeDto(); }

  save() {
    if (!this.dto.employeeCode || !this.dto.userName || !this.dto.fullName || !this.dto.email || !this.dto.status || !this.dto.joinDate) {
      this.message.error('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          if (!this.isEdit && this.codeConfig.auto) {
            this.loadCodeConfig(); // Refresh next number from server
          }
          this.search();
          this.close();
        }
      },
      error: (err: any) => {
      }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.search();
      }
    });
  }

  reset() { this.filter = new HrmEmployeeDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
