import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmEvaluationService, HrmEmployeeService } from '../../services';
import { HrmEvaluationDto, HrmEmployeeDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-hrm-evaluation',
  imports: [SharedModules],
  templateUrl: './hrm-evaluation.html',
  styleUrls: ['./hrm-evaluation.scss']
})
export class HrmEvaluation implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmEvaluationDto = new HrmEvaluationDto();
  filter: HrmEvaluationDto = new HrmEvaluationDto();
  statuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'IN_PROGRESS', label: 'Đang đánh giá', color: 'processing' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'green' }
  ];
  grades = ['A', 'B', 'C', 'D', 'F'];

  employees: any[] = [];
  evaluators: any[] = [];

  constructor(
    private global: GlobalService,
    private service: HrmEvaluationService,
    private empSvc: HrmEmployeeService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([{ name: 'Đánh giá nhân viên', path: 'hrm/evaluation' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  searchEmployees(value: string): void {
    const filter = new HrmEmployeeDto();
    filter.keyWord = value;
    filter.pageSize = 20;
    this.empSvc.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.employees = res.data || []; }
    });
  }

  searchEvaluators(value: string): void {
    const filter = new HrmEmployeeDto();
    filter.keyWord = value;
    filter.pageSize = 20;
    this.empSvc.search(filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.evaluators = res.data || []; }
    });
  }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    this.employees = [];
    this.evaluators = [];
    this.searchEmployees('');
    this.searchEvaluators('');
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.dto = res || new HrmEvaluationDto();
          if (!this.dto.details) this.dto.details = [];
          this.visible = true;
        }
      });
    } else {
      this.dto = new HrmEvaluationDto();
      this.dto.details = [];
      this.visible = true;
    }
  }

  close() { this.visible = false; this.dto = new HrmEvaluationDto(); }

  addDetailRow() {
    if (!this.dto.details) this.dto.details = [];
    this.dto.details = [
      ...this.dto.details,
      {
        id: '',
        evaluationId: this.dto.id || '',
        employeeId: '',
        evaluatorId: '',
        criteria: '',
        score: null,
        comment: ''
      }
    ];
  }

  removeDetailRow(index: number) {
    if (this.dto.details) {
      this.dto.details.splice(index, 1);
      this.dto.details = [...this.dto.details];
    }
  }

  save() {
    if (!this.dto.code || !this.dto.name) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.search();
        if (!this.isEdit) this.dto = new HrmEvaluationDto();
        this.visible = false;
      }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new HrmEvaluationDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
