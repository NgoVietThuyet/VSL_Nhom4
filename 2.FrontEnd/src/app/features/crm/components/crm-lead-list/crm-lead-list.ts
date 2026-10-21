import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { CrmLeadDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { CrmLeadDetail } from '../crm-lead-detail/crm-lead-detail';
import { CrmLeadForm } from '../crm-lead-form/crm-lead-form';

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  leads: CrmLeadDto[];
}

@Component({
  selector: 'app-crm-lead-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzButtonModule, NzInputModule, NzSelectModule, NzIconModule, NzTagModule,
    NzTableModule, NzSpinModule, NzEmptyModule, NzPaginationModule,
    NzPopconfirmModule, NzDrawerModule, NzDropDownModule, NzTooltipModule,
    CrmLeadForm, CrmLeadDetail,
  ],
  templateUrl: './crm-lead-list.html',
  styleUrls: ['./crm-lead-list.scss'],
})
export class CrmLeadList implements OnInit, OnDestroy {
  @ViewChild(CrmLeadForm) drawerForm?: CrmLeadForm;
  readonly Math = Math;
  private destroy$ = new Subject<void>();

  filterForm: FormGroup;
  leads: CrmLeadDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo lead';
  activeLead = new CrmLeadDto();
  drawerLoading = false;

  detailVisible = false;
  detailLead: CrmLeadDto | null = null;
  detailLoading = false;
  converting = false;

  viewMode: 'grid' | 'list' = 'list';
  activeTab = 'all';
  kanbanColumns: KanbanColumn[] = [];

  private readonly AVATAR_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];
  private readonly KANBAN_STATUSES = [
    { key: 'New',         label: 'Mới',               color: 'gray'  },
    { key: 'Contacted',   label: 'Đã liên hệ',        color: 'blue'  },
    { key: 'Qualified',   label: 'Tiềm năng',         color: 'green' },
    { key: 'Unqualified', label: 'Không tiềm năng',   color: 'red'   },
  ];
  private readonly STATUS_COLORS: Record<string, string> = {
    New: 'default', Contacted: 'processing', Qualified: 'success', Unqualified: 'error', Converted: 'purple',
  };
  private readonly STATUS_LABELS: Record<string, string> = {
    New: 'Mới', Contacted: 'Đã liên hệ', Qualified: 'Tiềm năng', Unqualified: 'Không tiềm năng', Converted: 'Đã chuyển đổi',
  };

  constructor(
    private fb: FormBuilder,
    private crmService: CrmService,
    private message: NzMessageService,
  ) {
    this.filterForm = this.fb.group({ keyWord: [''], status: [null], ownerUser: [''], sourceCode: [null] });
  }

  ngOnInit(): void {
    this.search();
    ['status', 'sourceCode'].forEach(key => {
      this.filterForm.get(key)!.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.search(1));
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private buildFilter(): any {
    const v = this.filterForm.value;
    const tabFilter: any = {};
    if (this.activeTab !== 'all') tabFilter.status = this.activeTab;
    return { ...v, ...tabFilter, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page: number = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.crmService.searchLeads(this.buildFilter()).subscribe({
      next: (response) => {
        const paged = response?.data;
        this.leads = paged?.data || [];
        this.total = paged?.totalRecord ?? 0;
        this.loading = false;
        this.updateKanbanBoard();
      },
      error: () => { this.loading = false; },
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab !== 'all') {
      this.filterForm.patchValue({ status: null }, { emitEvent: false });
    }
    this.search(1);
  }

  resetFilters(): void {
    this.filterForm.reset({ keyWord: '', status: null, ownerUser: '', sourceCode: null }, { emitEvent: false });
    this.activeTab = 'all';
    this.currentPage = 1;
    this.search(1);
  }

  updateKanbanBoard(): void {
    this.kanbanColumns = this.KANBAN_STATUSES.map(s => ({
      ...s,
      leads: this.leads.filter(l => l.status === s.key),
    }));
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  getStatusColor(status: string): string { return this.STATUS_COLORS[status] ?? 'default'; }
  getStatusLabel(status: string): string { return this.STATUS_LABELS[status] ?? status; }

  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '720px';
  }

  // ── Create / Edit drawer ──────────────────────────────────────────────────
  openCreateDrawer(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Tạo lead';
    this.activeLead = new CrmLeadDto();
    this.drawerVisible = true;
  }

  openCreateDrawerForStatus(status: string): void {
    this.openCreateDrawer();
    this.activeLead.status = status;
  }

  openEditDrawer(lead: CrmLeadDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật lead';
    this.activeLead = { ...lead };
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitDrawerForm(): void { this.drawerForm?.submit(); }

  onSubmitLead(lead: CrmLeadDto): void {
    this.drawerLoading = true;
    const action$ = this.drawerMode === 'create' ? this.crmService.createLead(lead) : this.crmService.updateLead(lead);
    action$.subscribe({
      next: () => {
        this.message.success(this.drawerMode === 'create' ? 'Tạo lead thành công' : 'Cập nhật lead thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  // ── Detail drawer ─────────────────────────────────────────────────────────
  openDetailDrawer(lead: CrmLeadDto): void {
    this.detailVisible = true;
    this.detailLead = { ...lead };
    this.detailLoading = true;
    this.crmService.leadDetail(lead.id).subscribe({
      next: (res) => {
        const full = res?.data ?? res;
        if (full?.id) this.detailLead = full;
        this.detailLoading = false;
      },
      error: () => { this.detailLoading = false; },
    });
  }

  closeDetailDrawer(): void {
    this.detailVisible = false;
    this.detailLead = null;
  }

  openEditFromDetail(): void {
    if (this.detailLead) {
      const lead = this.detailLead;
      this.closeDetailDrawer();
      this.openEditDrawer(lead);
    }
  }

  convertLeadFromDetail(): void {
    if (!this.detailLead?.id) return;
    this.converting = true;
    this.crmService.convertLead(this.detailLead.id).subscribe({
      next: () => {
        this.message.success('Chuyển đổi thành công! Đã tạo Customer & Opportunity.');
        this.converting = false;
        if (this.detailLead) this.detailLead = { ...this.detailLead, status: 'Converted' };
        this.search(this.currentPage);
      },
      error: () => { this.converting = false; },
    });
  }

  // ── List actions ──────────────────────────────────────────────────────────
  editLead(lead: CrmLeadDto): void { this.openEditDrawer(lead); }

  deleteLead(lead: CrmLeadDto): void {
    this.crmService.deleteLead(lead.id).subscribe({
      next: () => { this.message.success('Xóa lead thành công'); this.search(this.currentPage); },
      error: () => {},
    });
  }

  convertLead(lead: CrmLeadDto): void {
    this.crmService.convertLead(lead.id).subscribe({
      next: () => {
        this.message.success('Chuyển đổi lead thành công! Đã tạo Customer & Opportunity.');
        this.search(this.currentPage);
      },
    });
  }

  pageIndexChange(page: number): void { this.search(page); }
  pageSizeChange(size: number): void { this.pageSize = size; this.search(1); }
}
