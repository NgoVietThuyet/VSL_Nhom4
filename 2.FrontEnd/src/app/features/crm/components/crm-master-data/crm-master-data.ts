import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmLeadSourceDto, CrmCustomerGroupDto, CrmOpportunityStageDto, CrmCompetitorDto, CrmPriceListDto, CrmCustomerStatusDto, CrmCustomerTypeDto, CrmIndustryDto } from '../../models';
import { CrmService } from '../../services/crm.service';

type TabKey = 'leadSource' | 'customerGroup' | 'stage' | 'competitor' | 'priceList' | 'customerStatus' | 'customerType' | 'industry';

interface TabConfig {
  key: TabKey;
  title: string;
  data: any[];
  total: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  columns: { field: string; label: string }[];
}

@Component({
  selector: 'app-crm-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-master-data.html',
  styleUrls: ['./crm-master-data.scss'],
})
export class CrmMasterData implements OnInit {
  activeTabIndex = 0;
  keyWord = '';

  tabs: TabConfig[] = [
    { key: 'leadSource', title: 'Nguồn Lead', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }] },
    { key: 'customerGroup', title: 'Nhóm Khách hàng', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }, { field: 'category', label: 'Danh mục' }] },
    { key: 'stage', title: 'Giai đoạn cơ hội', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'sortOrder', label: 'Thứ tự' }] },
    { key: 'competitor', title: 'Đối thủ cạnh tranh', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }] },
    { key: 'priceList', title: 'Bảng giá', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'currency', label: 'Tiền tệ' }, { field: 'note', label: 'Ghi chú' }] },
    { key: 'customerStatus', title: 'Trạng thái KH', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }, { field: 'sortOrder', label: 'Thứ tự' }] },
    { key: 'customerType', title: 'Phân loại KH', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }, { field: 'sortOrder', label: 'Thứ tự' }] },
    { key: 'industry', title: 'Ngành nghề', data: [], total: 0, currentPage: 1, pageSize: 10, loading: false, columns: [{ field: 'code', label: 'Mã' }, { field: 'name', label: 'Tên' }, { field: 'description', label: 'Mô tả' }, { field: 'sortOrder', label: 'Thứ tự' }] },
  ];

  drawerVisible = false;
  drawerTitle = '';
  drawerForm: FormGroup;
  drawerTab?: TabConfig;
  drawerMode: 'create' | 'edit' = 'create';
  drawerLoading = false;

  constructor(private fb: FormBuilder, private svc: CrmService, private msg: NzMessageService) {
    this.drawerForm = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      category: [''],
      sortOrder: [null],
      customerGroupId: [''],
      currency: [''],
      note: [''],
    });
  }

  ngOnInit(): void { this.loadTab(this.tabs[0]); }

  get activeTab(): TabConfig { return this.tabs[this.activeTabIndex]; }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const tab = this.tabs[index];
    if (tab.data.length === 0) this.loadTab(tab);
  }

  loadTab(tab: TabConfig, page = 1): void {
    tab.currentPage = page;
    tab.loading = true;
    const filter = { keyWord: this.keyWord, currentPage: tab.currentPage, pageSize: tab.pageSize, isActive: true } as any;

    let search$: Observable<any>;
    switch (tab.key) {
      case 'leadSource': search$ = this.svc.searchLeadSources(filter); break;
      case 'customerGroup': search$ = this.svc.searchCustomerGroups(filter); break;
      case 'stage': search$ = this.svc.searchOpportunityStages(filter); break;
      case 'competitor': search$ = this.svc.searchCompetitors(filter); break;
      case 'priceList': search$ = this.svc.searchPriceLists(filter); break;
      case 'customerStatus': search$ = this.svc.searchCustomerStatuses(filter); break;
      case 'customerType': search$ = this.svc.searchCustomerTypes(filter); break;
      case 'industry': search$ = this.svc.searchIndustries(filter); break;
    }

    search$!.subscribe({
      next: (r: any) => {
        const paged = r?.data;
        tab.data = paged?.data ?? [];
        tab.total = paged?.totalRecord ?? 0;
        tab.loading = false;
      },
      error: () => { tab.loading = false; },
    });
  }

  searchCurrent(): void { this.loadTab(this.activeTab); }

  openCreate(): void {
    this.drawerMode = 'create';
    this.drawerTab = this.activeTab;
    this.drawerTitle = 'Thêm ' + this.activeTab.title;
    this.drawerForm.reset();
    this.drawerVisible = true;
  }

  openEdit(item: any): void {
    this.drawerMode = 'edit';
    this.drawerTab = this.activeTab;
    this.drawerTitle = 'Cập nhật ' + this.activeTab.title;
    this.drawerForm.patchValue(item);
    this.drawerVisible = true;
  }

  submitDrawer(): void {
    if (this.drawerForm.invalid) {
      Object.values(this.drawerForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    if (!this.drawerTab) return;
    this.drawerLoading = true;
    const val = { ...this.drawerForm.value };

    let action$: Observable<any>;
    switch (this.drawerTab.key) {
      case 'leadSource': action$ = this.drawerMode === 'create' ? this.svc.createLeadSource(val) : this.svc.updateLeadSource(val); break;
      case 'customerGroup': action$ = this.drawerMode === 'create' ? this.svc.createCustomerGroup(val) : this.svc.updateCustomerGroup(val); break;
      case 'stage': action$ = this.drawerMode === 'create' ? this.svc.createOpportunityStage(val) : this.svc.updateOpportunityStage(val); break;
      case 'competitor': action$ = this.drawerMode === 'create' ? this.svc.createCompetitor(val) : this.svc.updateCompetitor(val); break;
      case 'priceList': action$ = this.drawerMode === 'create' ? this.svc.createPriceList(val) : this.svc.updatePriceList(val); break;
      case 'customerStatus': action$ = this.drawerMode === 'create' ? this.svc.createCustomerStatus(val) : this.svc.updateCustomerStatus(val); break;
      case 'customerType': action$ = this.drawerMode === 'create' ? this.svc.createCustomerType(val) : this.svc.updateCustomerType(val); break;
      case 'industry': action$ = this.drawerMode === 'create' ? this.svc.createIndustry(val) : this.svc.updateIndustry(val); break;
    }

    action$!.subscribe({
      next: () => {
        this.msg.success(this.drawerMode === 'create' ? 'Thêm thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.loadTab(this.drawerTab!);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteItem(item: any): void {
    const tab = this.activeTab;
    let delete$: Observable<any>;
    switch (tab.key) {
      case 'leadSource': delete$ = this.svc.deleteLeadSource(item.id); break;
      case 'customerGroup': delete$ = this.svc.deleteCustomerGroup(item.id); break;
      case 'stage': delete$ = this.svc.deleteOpportunityStage(item.id); break;
      case 'competitor': delete$ = this.svc.deleteCompetitor(item.id); break;
      case 'priceList': delete$ = this.svc.deletePriceList(item.id); break;
      case 'customerStatus': delete$ = this.svc.deleteCustomerStatus(item.id); break;
      case 'customerType': delete$ = this.svc.deleteCustomerType(item.id); break;
      case 'industry': delete$ = this.svc.deleteIndustry(item.id); break;
    }
    delete$!.subscribe({
      next: () => { this.msg.success('Xóa thành công'); this.loadTab(tab); },
    });
  }

  closeDrawer(): void { this.drawerVisible = false; }

  pageIndexChange(tab: TabConfig, page: number): void { this.loadTab(tab, page); }

  pageSizeChange(tab: TabConfig, size: number): void { tab.pageSize = size; this.loadTab(tab, 1); }

  showField(key: TabKey, field: string): boolean {
    if (field === 'category') return key === 'customerGroup';
    if (field === 'sortOrder') return key === 'stage' || key === 'customerStatus' || key === 'customerType' || key === 'industry';
    if (field === 'currency' || field === 'customerGroupId') return key === 'priceList';
    return true;
  }
}
