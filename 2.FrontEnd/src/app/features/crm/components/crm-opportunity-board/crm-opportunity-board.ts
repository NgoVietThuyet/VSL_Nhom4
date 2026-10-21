import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmOpportunityFullDto, CrmOpportunityPipelineDto } from '../../models';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-opportunity-board',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-opportunity-board.html',
  styleUrls: ['./crm-opportunity-board.scss'],
})
export class CrmOpportunityBoard implements OnInit, OnDestroy {
  readonly Math = Math;
  private destroy$ = new Subject<void>();

  // View mode
  viewMode: 'board' | 'list' = 'board';

  // Board
  stages: CrmOpportunityPipelineDto[] = [];
  boardLoading = false;

  // List
  opportunities: CrmOpportunityFullDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  listLoading = false;
  filterForm: FormGroup;
  activeTab: 'all' | 'won' | 'lost' = 'all';

  // Drawer
  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo cơ hội';
  drawerLoading = false;
  opportunityForm: FormGroup;

  readonly stageOptions = [
    { code: 'PROSPECTING', label: 'Tiếp cận' },
    { code: 'QUALIFIED', label: 'Đủ điều kiện' },
    { code: 'PROPOSAL', label: 'Đề xuất' },
    { code: 'NEGOTIATION', label: 'Đàm phán' },
    { code: 'WON', label: 'Lãi' },
    { code: 'LOST', label: 'Lỗ' },
  ];

  private readonly stageLabelMap: Record<string, string> = Object.fromEntries(
    this.stageOptions.map(s => [s.code, s.label])
  );

  constructor(
    private fb: FormBuilder,
    private svc: CrmService,
    private message: NzMessageService,
    private router: Router,
  ) {
    this.filterForm = this.fb.group({
      keyWord: [''],
      stageCode: [null],
      ownerUser: [''],
    });
    this.opportunityForm = this.fb.group({
      id: [''],
      code: ['', Validators.required],
      name: ['', Validators.required],
      customerId: [''],
      stageCode: ['PROSPECTING'],
      amount: [null],
      probability: [null],
      closeDate: [null],
      ownerUser: [''],
      lossReason: [''],
      competitorId: [''],
    });
  }

  ngOnInit(): void {
    this.loadPipeline();
    this.filterForm.get('stageCode')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.search(1));
    this.filterForm.get('ownerUser')!.valueChanges
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.search(1));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── View toggle ──────────────────────────────────────────────────
  switchToBoard(): void { this.viewMode = 'board'; this.loadPipeline(); }
  switchToList(): void { this.viewMode = 'list'; this.search(); }

  // ── Board ────────────────────────────────────────────────────────
  loadPipeline(): void {
    this.boardLoading = true;
    this.svc.pipeline().subscribe({
      next: (res) => {
        const apiStages = res ?? [];
        this.stages = this.stageOptions.map(opt => {
          const found = apiStages.find(s => s.stageCode === opt.code);
          return found ?? { stageCode: opt.code, stageName: opt.label, count: 0, opportunities: [] };
        });
        this.boardLoading = false;
      },
      error: () => { this.boardLoading = false; },
    });
  }

  // ── List ─────────────────────────────────────────────────────────
  private buildFilter(): any {
    const v = this.filterForm.value;
    const tabFilter: any = {};
    if (this.activeTab === 'won') tabFilter.stageCode = 'WON';
    if (this.activeTab === 'lost') tabFilter.stageCode = 'LOST';
    return { ...v, ...tabFilter, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page = 1): void {
    this.currentPage = page;
    this.listLoading = true;
    this.svc.searchOpportunities(this.buildFilter()).subscribe({
      next: (res) => {
        const paged = res?.data;
        this.opportunities = paged?.data ?? [];
        this.total = paged?.totalRecord ?? 0;
        this.listLoading = false;
      },
      error: () => { this.listLoading = false; },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ keyWord: '', stageCode: null, ownerUser: '' }, { emitEvent: false });
    this.activeTab = 'all';
    this.search(1);
  }

  setTab(tab: 'all' | 'won' | 'lost'): void {
    this.activeTab = tab;
    if (tab !== 'all') this.filterForm.patchValue({ stageCode: null }, { emitEvent: false });
    this.search(1);
  }

  pageIndexChange(p: number): void { this.search(p); }
  pageSizeChange(s: number): void { this.pageSize = s; this.search(1); }

  // ── Navigation ───────────────────────────────────────────────────
  openDetail(opp: CrmOpportunityFullDto, event?: Event): void {
    if (event) event.stopPropagation();
    if (opp.id) this.router.navigate(['/crm/opportunity', opp.id]);
  }

  // ── Drawer CRUD ──────────────────────────────────────────────────
  openCreate(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Tạo cơ hội mới';
    this.opportunityForm.reset({ stageCode: 'PROSPECTING' });
    this.drawerVisible = true;
  }

  openEdit(opp: CrmOpportunityFullDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật cơ hội';
    this.opportunityForm.patchValue({
      ...opp,
      closeDate: opp.closeDate ? new Date(opp.closeDate) : null,
    });
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitForm(): void {
    if (this.opportunityForm.invalid) {
      Object.values(this.opportunityForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.drawerLoading = true;
    const val = { ...this.opportunityForm.value } as CrmOpportunityFullDto;
    const action$ = this.drawerMode === 'create'
      ? this.svc.createOpportunity(val)
      : this.svc.updateOpportunity(val);
    action$.subscribe({
      next: () => {
        this.message.success(this.drawerMode === 'create' ? 'Tạo cơ hội thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.reload();
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteOpportunity(opp: CrmOpportunityFullDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.svc.deleteOpportunity(opp.id).subscribe({
      next: () => { this.message.success('Xóa cơ hội thành công'); this.reload(); },
    });
  }

  markWon(opp: CrmOpportunityFullDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.svc.wonOpportunity(opp.id).subscribe({
      next: () => { this.message.success('Đánh dấu lãi thành công'); this.reload(); },
    });
  }

  markLost(opp: CrmOpportunityFullDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.svc.lostOpportunity(opp.id).subscribe({
      next: () => { this.message.success('Đánh dấu lỗ thành công'); this.reload(); },
    });
  }

  private reload(): void {
    this.viewMode === 'board' ? this.loadPipeline() : this.search(this.currentPage);
  }

  // ── Helpers ──────────────────────────────────────────────────────
  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '560px';
  }

  getStageLabel(code: string): string {
    return this.stageLabelMap[code?.toUpperCase()] ?? code;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  }

  totalStageAmount(stage: CrmOpportunityPipelineDto): number {
    return (stage.opportunities ?? []).reduce((sum, o) => sum + (o.amount ?? 0), 0);
  }

  getStageColor(code: string): string {
    const map: Record<string, string> = {
      PROSPECTING: 'default', QUALIFIED: 'blue', PROPOSAL: 'orange',
      NEGOTIATION: 'purple', WON: 'success', LOST: 'error',
    };
    return map[code?.toUpperCase()] ?? 'default';
  }

  getStageAccent(code: string): string {
    const map: Record<string, string> = {
      PROSPECTING: '#9ca3af', QUALIFIED: '#1677ff', PROPOSAL: '#fa8c16',
      NEGOTIATION: '#722ed1', WON: '#52c41a', LOST: '#ff4d4f',
    };
    return map[code?.toUpperCase()] ?? '#e5e7eb';
  }

  getProbColor(prob: number | null): string {
    if (prob == null) return 'default';
    if (prob >= 70) return 'green';
    if (prob >= 40) return 'orange';
    return 'red';
  }
}
