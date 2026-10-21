import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmContractService, HrmEmployeeService, HrmMasterDataService } from '../../services';
import { HrmContractDto, HrmEmployeeDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { SALARY_ITEM_TYPES, SALARY_AVAILABLE_VARIABLES } from '../../constants';

@Component({
  selector: 'app-hrm-contract',
  imports: [SharedModules, NzCollapseModule],
  templateUrl: './hrm-contract.html',
  styleUrls: ['./hrm-contract.scss']
})
export class HrmContract implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmContractDto = new HrmContractDto();
  filter: HrmContractDto = new HrmContractDto();
  contractTypes = [
    { value: 'PROBATION', label: 'Thử việc' },
    { value: 'FIXED_TERM', label: 'Có thời hạn' },
    { value: 'UNLIMITED', label: 'Không thời hạn' },
    { value: 'SEASONAL', label: 'Thời vụ' }
  ];
  statuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'ACTIVE', label: 'Hiệu lực', color: 'green' },
    { value: 'EXPIRED', label: 'Hết hạn', color: 'orange' },
    { value: 'TERMINATED', label: 'Chấm dứt', color: 'red' }
  ];
  salaryItemTypes = SALARY_ITEM_TYPES.filter(x => x.value !== 'SYSTEM_VARIABLE');

  employees: any[] = [];
  salaryStructures: any[] = [];

  constructor(
    private global: GlobalService,
    private service: HrmContractService,
    private empSvc: HrmEmployeeService,
    private masterSvc: HrmMasterDataService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Hợp đồng lao động', path: 'hrm/contract' }]);
  }

  ngOnInit(): void {
    this.search();
    this.loadSalaryStructures();
  }

  loadSalaryStructures() {
    this.masterSvc.getAllSalaryStructures().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.salaryStructures = res || []; }
    });
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onStructureChange(id: string) {
    if (!id) {
      this.dto.salaryItems = [];
      return;
    }
    this.masterSvc.getSalaryItemsByStructure(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.dto.salaryItems = res.map((x: any) => {
          const matchedPreset = SALARY_AVAILABLE_VARIABLES.find(p => p.code === x.itemCode);
          return {
            itemCode: x.itemCode,
            itemName: x.itemName,
            type: matchedPreset?.componentType || x.type,
            amount: x.amount,
            isTaxable: x.isTaxable
          };
        });
        const baseItem = this.dto.salaryItems?.find((x: any) => this.isBaseSalaryItem(x));
        if (baseItem && (!this.dto.basicSalary || this.dto.basicSalary <= 0)) {
          this.dto.basicSalary = baseItem.amount || 0;
        }
        this.calculateAllowanceTotal();
      }
    });
  }

  calculateAllowanceTotal() {
    if (this.dto.salaryItems) {
      let total = 0;
      this.dto.salaryItems.forEach((x: any) => {
        if (this.isAllowanceItem(x)) {
          total += x.amount || 0;
        }
      });
      this.dto.allowanceTotal = total;
    }
  }

  isBaseSalaryItem(item: any): boolean {
    const code = (item?.itemCode || '').trim().toUpperCase();
    return ['SALARY_BASE', 'BASIC_SALARY', 'BASE_SALARY', 'SALARY_GROSS', '001'].includes(code);
  }

  isAllowanceItem(item: any): boolean {
    if (this.isBaseSalaryItem(item)) return false;
    const type = (item?.type || '').trim().toUpperCase();
    return type === 'ALLOWANCE' || type === 'EARNING_FIXED' || type === 'EARNING';
  }

  salaryItemTypeLabel(type: string): string {
    return this.salaryItemTypes.find(x => x.value === type)?.label || type;
  }

  onItemAmountChange(item: any) {
    if (this.isBaseSalaryItem(item)) {
      this.dto.basicSalary = item.amount || 0;
    }
    this.calculateAllowanceTotal();
  }

  syncBaseSalaryItem() {
    const baseItem = this.dto.salaryItems?.find((x: any) => this.isBaseSalaryItem(x));
    if (baseItem) {
      baseItem.amount = this.dto.basicSalary || 0;
    }
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }
  typeLabel(v: string) { return this.contractTypes.find(x => x.value === v)?.label || v; }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.dto = res || new HrmContractDto();
          if (this.dto.salaryItems) {
            this.dto.salaryItems = this.dto.salaryItems.map((x: any) => {
              const matchedPreset = SALARY_AVAILABLE_VARIABLES.find(p => p.code === x.itemCode);
              return {
                ...x,
                type: matchedPreset?.componentType || x.type
              };
            });
          }
          if (!this.dto.salarySnapshots) {
            this.dto.salarySnapshots = [];
          } else {
            // Sort snapshots descending by fromDate
            this.dto.salarySnapshots.sort((a: any, b: any) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime());
            // Parse itemsJson for each snapshot
            this.dto.salarySnapshots.forEach((snap: any) => {
              if (snap.itemsJson) {
                try {
                  const rawItems = JSON.parse(snap.itemsJson);
                  snap.salaryItems = (rawItems || []).map((x: any) => {
                    const code = x.itemCode || x.ItemCode;
                    const matchedPreset = SALARY_AVAILABLE_VARIABLES.find(p => p.code === code);
                    return {
                      itemCode: code,
                      itemName: x.itemName || x.ItemName,
                      type: matchedPreset?.componentType || x.type || x.Type,
                      amount: x.amount !== undefined ? x.amount : x.Amount
                    };
                  });
                } catch (e) {
                  snap.salaryItems = [];
                }
              } else {
                snap.salaryItems = [];
              }
            });
          }
          this.visible = true;
        }
      });
    } else {
      this.dto = new HrmContractDto();
      this.dto.salarySnapshots = [];
      this.visible = true;
    }
  }

  close() { this.visible = false; this.dto = new HrmContractDto(); }

  searchEmployees(value: string): void {
    const filter = new HrmEmployeeDto();
    filter.keyWord = value;
    filter.pageSize = 20;
    this.empSvc.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.employees = res.data || []; }
    });
  }

  onEmployeeChange(id: string) {
    const emp = this.employees.find(x => x.id === id);
    if (emp) {
      this.dto.position = emp.titleName;
    }
  }

  save() {
    if (!this.dto.contractCode || !this.dto.employeeId || !this.dto.contractType || !this.dto.fromDate || !this.dto.status) {
      this.message.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.search();
          if (!this.isEdit) this.dto = new HrmContractDto();
          this.visible = false;
        }
      },
      error: (err: any) => {
      }
    });
  }

  terminate(item: any) {
    this.service.terminate(item.id, {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.search();
      }
    });
  }

  reset() { this.filter = new HrmContractDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
