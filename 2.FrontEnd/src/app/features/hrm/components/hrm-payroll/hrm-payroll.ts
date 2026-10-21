import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmPayrollService, HrmEmployeeService } from '../../services';
import { HrmPayrollCalculationResultDto, HrmPayrollPeriodDto, HrmPayslipDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SALARY_AVAILABLE_VARIABLES } from '../../constants';

@Component({
  selector: 'app-hrm-payroll',
  imports: [SharedModules],
  templateUrl: './hrm-payroll.html',
  styleUrls: ['./hrm-payroll.scss']
})
export class HrmPayroll implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visiblePeriod = false;
  visiblePayslips = false;
  periods: PaginationResult = new PaginationResult();
  payslips: PaginationResult = new PaginationResult();
  periodDto: HrmPayrollPeriodDto = new HrmPayrollPeriodDto();
  periodFilter: HrmPayrollPeriodDto = new HrmPayrollPeriodDto();
  payslipFilter: HrmPayslipDto = new HrmPayslipDto();
  selectedPeriodId: string = '';
  selectedPayslip: any = null;
  payslipTableScrollX = '1300px';
  calculationResult: HrmPayrollCalculationResultDto | null = null;
  periodDate: Date | null = null;
  statuses = [
    { value: 'OPEN', label: 'Mở', color: 'processing' },
    { value: 'CLOSED', label: 'Đã khoá', color: 'default' }
  ];
  payslipStatuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'FINALIZED', label: 'Hoàn thành', color: 'blue' },
    { value: 'PAID', label: 'Đã trả', color: 'green' }
  ];

  visibleCalcModal = false;
  calcTargetType = 'ALL';
  calcTargetId: string | null = null;
  activePeriodItem: any = null;
  organizes: any[] = [];
  employees: any[] = [];

  constructor(
    private global: GlobalService,
    private service: HrmPayrollService,
    private empService: HrmEmployeeService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Bảng lương', path: 'hrm/payroll' }]);
  }

  ngOnInit(): void { this.searchPeriods(); }

  searchPeriods() {
    this.service.searchPeriods(this.periodFilter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.periods = res });
  }

  selectPeriod(item: any) {
    this.selectedPeriodId = item.id;
    this.payslipFilter.periodId = item.id;
    this.visiblePayslips = true;
    this.searchPayslips();
  }

  closePayslips() {
    this.visiblePayslips = false;
  }

  searchPayslips() {
    this.service.payslipsByPeriod(this.payslipFilter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.setPayslips(res) });
  }

  setPayslips(res: any) {
    this.payslips = res || new PaginationResult();
    this.payslipTableScrollX = '1300px';
  }

  getBaseSalary(payslip: any): number {
    const item = (payslip.items || []).find((x: any) => {
      const code = (x.itemCode || '').trim().toUpperCase();
      return code === 'BASIC_SALARY' || code === 'GROSS_SALARY' || code === 'SALARY_BASE' || code === 'BASE_SALARY';
    });
    return item ? item.amount : 0;
  }

  getInitials(name: string): string {
    if (!name) return 'EE';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getItemName(item: any): string {
    const code = (item.itemCode || '').trim().toUpperCase();
    if (code === 'BASIC_SALARY' || code === 'BASE_SALARY' || item.itemName === 'Base salary') {
      return 'Lương cơ bản';
    }
    if (code === 'ITEM_1') {
      return 'Phụ cấp chức vụ';
    }
    if (code === 'ITEM_2') {
      return 'Phụ cấp ăn trưa';
    }
    if (code === 'ITEM_3') {
      return 'Phụ cấp xăng xe';
    }
    if (code === 'STATUTORY_INSURANCE') {
      return 'Bảo hiểm xã hội';
    }
    if (code === 'PERSONAL_INCOME_TAX' || code === 'TAX' || code === 'PIT') {
      return 'Thuế thu nhập cá nhân';
    }

    // Look up in SALARY_AVAILABLE_VARIABLES as fallback
    const matched = SALARY_AVAILABLE_VARIABLES.find(x => x.code === code);
    if (matched) {
      return matched.label;
    }

    return item.itemName || item.itemCode || '';
  }

  getEarnings(payslip: any): any[] {
    return (payslip.items || []).filter((x: any) => x.type === 'EARNING' && (x.amount > 0 || (x.itemCode || '').trim().toUpperCase() === 'BASIC_SALARY'));
  }

  getDeductions(payslip: any): any[] {
    return (payslip.items || []).filter((x: any) => x.type === 'DEDUCTION' && x.amount > 0);
  }

  onPeriodPageChange(index: number) {
    this.periodFilter.currentPage = index;
    this.searchPeriods();
  }

  onPeriodPageSizeChange(size: number) {
    this.periodFilter.pageSize = size;
    this.searchPeriods();
  }

  onPayslipPageChange(index: number) {
    this.payslipFilter.currentPage = index;
    this.searchPayslips();
  }

  onPayslipPageSizeChange(size: number) {
    this.payslipFilter.pageSize = size;
    this.searchPayslips();
  }

  viewPayslipDetail(item: any) {
    this.service.payslip(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.selectedPayslip = res?.data || res; }
    });
  }

  closePayslipDetail() {
    this.selectedPayslip = null;
  }

  printPayslip() {
    window.print();
  }

  trackById(_: number, item: any) { return item.id; }
  trackByColumn(_: number, item: any) { return item.code; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }
  payslipStatusInfo(s: string) { return this.payslipStatuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  openCreatePeriod() { this.periodDto = new HrmPayrollPeriodDto(); this.periodDto.year = new Date().getFullYear(); this.periodDto.month = new Date().getMonth() + 1; this.visiblePeriod = true; }
  closeCreatePeriod() { this.visiblePeriod = false; }

  createPeriod() {
    if (!this.periodDto.code || !this.periodDto.year || !this.periodDto.month || !this.periodDto.fromDate || !this.periodDto.toDate) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    this.service.createPeriod(this.periodDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.searchPeriods();
          this.closeCreatePeriod();
        }
      }
    });
  }

  closePeriod(item: any) {
    this.service.closePeriod(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.searchPeriods() });
  }

  openCalculate(item: any) {
    this.activePeriodItem = item;
    this.calcTargetType = 'ALL';
    this.calcTargetId = null;
    this.calculationResult = null;
    this.visibleCalcModal = true;

    if (this.organizes.length === 0) {
      this.empService.orgTree().subscribe({
        next: (res: any) => {
          this.organizes = this.flattenOrgTree(res?.data || res || []);
        }
      });
    }

    if (this.employees.length === 0) {
      const filter = { currentPage: 1, pageSize: 1000 } as any;
      this.empService.search(filter).subscribe({
        next: (res: any) => {
          this.employees = res?.data || [];
        }
      });
    }
  }

  flattenOrgTree(tree: any): any[] {
    const list: any[] = [];
    if (!tree) return list;

    const recurse = (nodes: any) => {
      if (!nodes) return;
      if (Array.isArray(nodes)) {
        for (const node of nodes) {
          if (node) {
            list.push({ id: node.id || node.key, name: node.name || node.title });
            if (node.children) {
              recurse(node.children);
            }
          }
        }
      } else {
        list.push({ id: nodes.id || nodes.key, name: nodes.name || nodes.title });
        if (nodes.children) {
          recurse(nodes.children);
        }
      }
    };

    recurse(tree);
    return list;
  }

  submitCalculate() {
    if (!this.activePeriodItem) return;

    if (this.calcTargetType !== 'ALL' && !this.calcTargetId) {
      this.message.warning('Vui lòng chọn bộ phận hoặc nhân viên cụ thể');
      return;
    }

    this.service.calculate(this.activePeriodItem.id, this.calcTargetType, this.calcTargetId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.calculationResult = res?.data || null;
          this.visibleCalcModal = false;
          this.searchPeriods();
          if (this.selectedPeriodId === this.activePeriodItem.id) {
            this.searchPayslips();
          }
          if (this.calculationResult) {
            const warningCount = this.calculationResult.warnings?.length || 0;
            this.message.info(`Payroll calculated: ${this.calculationResult.created} created, ${this.calculationResult.updated} updated, ${this.calculationResult.skipped} skipped, ${warningCount} warning(s).`);
          }
        }
      });
  }

  payPayslip(item: any) {
    this.service.pay(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.searchPayslips() });
  }

  onPeriodDateChange(date: Date) {
    if (date) {
      this.periodDto.year = date.getFullYear();
      this.periodDto.month = date.getMonth() + 1;
    }
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
