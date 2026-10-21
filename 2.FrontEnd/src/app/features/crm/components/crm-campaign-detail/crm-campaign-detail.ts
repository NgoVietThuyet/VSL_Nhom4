import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmCampaignDto, CrmCampaignMemberAddDto, CrmCampaignRoiDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { CrmCampaignForm } from '../crm-campaign-form/crm-campaign-form';

@Component({
  selector: 'app-crm-campaign-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModules, CrmCampaignForm],
  templateUrl: './crm-campaign-detail.html',
  styleUrls: ['./crm-campaign-detail.scss'],
})
export class CrmCampaignDetail implements OnInit {
  @ViewChild(CrmCampaignForm) drawerForm?: CrmCampaignForm;

  campaigns: CrmCampaignDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  filterForm: FormGroup;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo chiến dịch';
  drawerLoading = false;
  activeCampaign: CrmCampaignDto = new CrmCampaignDto();

  selectedCampaign?: CrmCampaignDto;
  detailLoading = false;
  roiData?: CrmCampaignRoiDto;
  memberLeadIds = '';

  statusOptions = ['Draft', 'Active', 'Completed', 'Cancelled'];

  constructor(private fb: FormBuilder, private svc: CrmService, private msg: NzMessageService) {
    this.filterForm = this.fb.group({ keyWord: [''], status: [''] });
  }

  ngOnInit(): void { this.search(); }

  private buildFilter(): any {
    return { ...this.filterForm.value, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.svc.searchCampaigns(this.buildFilter()).subscribe({
      next: (res) => {
        const paged = res?.data;
        this.campaigns = paged?.data ?? [];
        this.total = paged?.totalRecord ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ keyWord: '', status: '' });
    this.search(1);
  }

  openCreate(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Tạo chiến dịch';
    this.activeCampaign = new CrmCampaignDto();
    this.drawerVisible = true;
  }

  openEdit(c: CrmCampaignDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật chiến dịch';
    this.activeCampaign = { ...c };
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitDrawerForm(): void { this.drawerForm?.submit(); }

  onSubmitCampaign(campaign: CrmCampaignDto): void {
    this.drawerLoading = true;
    const action$ = this.drawerMode === 'create'
      ? this.svc.createCampaign(campaign)
      : this.svc.updateCampaign(campaign);
    action$.subscribe({
      next: () => {
        this.msg.success(this.drawerMode === 'create' ? 'Tạo chiến dịch thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.drawerMode === 'create' ? 1 : this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteCampaign(c: CrmCampaignDto): void {
    this.svc.deleteCampaign(c.id).subscribe({
      next: () => { this.msg.success('Xóa chiến dịch thành công'); this.search(this.currentPage); },
    });
  }

  selectCampaign(c: CrmCampaignDto): void {
    this.detailLoading = true;
    this.svc.campaignDetail(c.id).subscribe({
      next: (res) => {
        this.selectedCampaign = res?.data ?? undefined;
        this.detailLoading = false;
        this.loadRoi(c.id);
      },
      error: () => { this.detailLoading = false; },
    });
  }

  loadRoi(campaignId: string): void {
    this.svc.campaignRoi(campaignId).subscribe({
      next: (res) => { this.roiData = res?.data ?? undefined; },
    });
  }

  addMembers(): void {
    if (!this.selectedCampaign || !this.memberLeadIds.trim()) return;
    const dto = new CrmCampaignMemberAddDto();
    dto.campaignId = this.selectedCampaign.id;
    dto.leadIds = this.memberLeadIds.split(',').map(s => s.trim()).filter(Boolean);
    this.svc.addCampaignMembers(dto).subscribe({
      next: () => {
        this.msg.success('Thêm thành viên thành công');
        this.memberLeadIds = '';
        this.selectCampaign(this.selectedCampaign!);
      },
    });
  }

  closeDetail(): void { this.selectedCampaign = undefined; this.roiData = undefined; }

  pageIndexChange(p: number): void { this.search(p); }
  pageSizeChange(s: number): void { this.pageSize = s; this.search(1); }

  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { Draft: 'default', Active: 'processing', Completed: 'success', Cancelled: 'error' };
    return map[status] ?? 'default';
  }
}
