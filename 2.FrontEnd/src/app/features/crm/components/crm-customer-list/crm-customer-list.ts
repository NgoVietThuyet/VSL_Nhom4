import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CrmCustomerDto, CrmCustomerGroupDto } from '../../models';
import { CrmService } from '../../services/crm.service';
import { CrmCustomerDetail } from '../crm-customer-detail/crm-customer-detail';
import { CrmCustomerForm } from '../crm-customer-form/crm-customer-form';
import { CrmCustomerTable } from '../crm-customer-table/crm-customer-table';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-crm-customer-list',
  standalone: true,
  imports: [CommonModule, SharedModules, CrmCustomerForm, CrmCustomerTable, CrmCustomerDetail],
  templateUrl: './crm-customer-list.html',
  styleUrls: ['./crm-customer-list.scss'],
})
export class CrmCustomerList implements OnInit, OnDestroy {
  @ViewChild(CrmCustomerForm) drawerForm?: CrmCustomerForm;
  readonly Math = Math;
  private destroy$ = new Subject<void>();

  filterForm: FormGroup;
  customers: CrmCustomerDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo khách hàng';
  activeCustomer = new CrmCustomerDto();
  drawerLoading = false;

  detailVisible = false;
  detailCustomer: CrmCustomerDto | null = null;
  detailLoading = false;

  viewMode: 'list' | 'grid' = 'list';
  activeTab = 'all';
  exportLoading = false;
  importLoading = false;
  private confirmedKeyWord = '';

  statusOptions: string[] = [];
  typeOptions: string[] = [];
  industryOptions: string[] = [];
  groupOptions: CrmCustomerGroupDto[] = [];
  sourceOptions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private crmService: CrmService,
    private message: NzMessageService,
  ) {
    this.filterForm = this.fb.group({
      keyWord: [''],
      status: [null],
      customerType: [null],
      industry: [null],
      groupId: [null],
      leadSource: [null],
    });
  }

  ngOnInit(): void {
    this.search();
    this.loadFilterOptions();
    // Lắng nghe thay đổi từ các dropdown filter, trigger search ngay khi chọn
    ['status', 'customerType', 'industry', 'groupId', 'leadSource'].forEach(key => {
      this.filterForm.get(key)!.valueChanges
        .pipe(takeUntil(this.destroy$), debounceTime(0))
        .subscribe(() => this.search(1));
    });

  }

  private loadFilterOptions(): void {
    this.crmService.listCustomerStatuses().subscribe(v => this.statusOptions = v);
    this.crmService.listCustomerTypes().subscribe(v => this.typeOptions = v);
    this.crmService.listIndustries().subscribe(v => this.industryOptions = v);
    this.crmService.listLeadSources().subscribe(v => this.sourceOptions = v);
    this.crmService.listCustomerGroups().subscribe(v => this.groupOptions = v);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildFilter(): any {
    const v = this.filterForm.value;
    const tabFilter: any = this.activeTab !== 'all' ? { customerType: this.activeTab } : {};
    return { ...v, keyWord: this.confirmedKeyWord, ...tabFilter, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  searchByKeyWord(): void {
    this.confirmedKeyWord = this.filterForm.get('keyWord')?.value ?? '';
    this.search(1);
  }

  search(page: number = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.crmService.searchCustomers(this.buildFilter()).subscribe({
      next: (response) => {
        const result = response?.data || response;
        const paged = result?.data || result;
        this.customers = Array.isArray(paged) ? paged : [];
        this.total = result?.totalRecord ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  resetFilters(): void {
    this.confirmedKeyWord = '';
    // emitEvent: false để tránh valueChanges trigger search trước khi tab filter được build
    this.filterForm.reset(
      { keyWord: '', status: null, customerType: null, industry: null, groupId: null, leadSource: null },
      { emitEvent: false }
    );
    this.currentPage = 1;
    this.search(1);
  }

  get isTabFiltered(): boolean { return this.activeTab !== 'all'; }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab !== 'all') {
      this.filterForm.patchValue({ customerType: null }, { emitEvent: false });
    }
    this.search(1);
  }

  get countAll(): number { return this.total; }

  openCreateDrawer(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Tạo khách hàng';
    this.activeCustomer = new CrmCustomerDto();
    this.drawerVisible = true;
  }

  openEditDrawer(customer: CrmCustomerDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Chỉnh sửa khách hàng';
    this.activeCustomer = { ...customer };
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitDrawerForm(): void { this.drawerForm?.submit(); }

  onSubmitCustomer(customer: CrmCustomerDto): void {
    this.drawerLoading = true;
    const action$ = this.drawerMode === 'create'
      ? this.crmService.createCustomer(customer)
      : this.crmService.updateCustomer(customer);
    action$.subscribe({
      next: () => {
        this.message.success(this.drawerMode === 'create' ? 'Tạo khách hàng thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.drawerMode === 'create' ? 1 : this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  viewCustomer(customer: CrmCustomerDto): void {
    this.detailVisible = true;
    this.detailCustomer = { ...customer };
    this.detailLoading = true;
    this.crmService.customerDetail(customer.id).subscribe({
      next: (res) => {
        const full = res?.data ?? res;
        if (full?.id) this.detailCustomer = full;
        this.detailLoading = false;
      },
      error: () => { this.detailLoading = false; },
    });
  }

  closeDetailDrawer(): void { this.detailVisible = false; }

  openEditFromDetail(): void {
    if (this.detailCustomer) {
      this.closeDetailDrawer();
      this.openEditDrawer(this.detailCustomer);
    }
  }

  editCustomer(customer: CrmCustomerDto): void { this.openEditDrawer(customer); }

  deleteCustomer(customer: CrmCustomerDto): void {
    this.crmService.deleteCustomer(customer.id).subscribe({
      next: () => { this.message.success('Xóa khách hàng thành công'); this.search(this.currentPage); },
    });
  }

  // ── Import preview ──────────────────────────────────────────
  previewVisible = false;
  previewCustomers: (CrmCustomerDto & { _selected: boolean })[] = [];

  get allSelected(): boolean {
    return this.previewCustomers.length > 0 && this.previewCustomers.every(c => c._selected);
  }
  get indeterminate(): boolean {
    return this.previewCustomers.some(c => c._selected) && !this.allSelected;
  }
  get selectedCount(): number {
    return this.previewCustomers.filter(c => c._selected).length;
  }

  toggleSelectAll(checked: boolean): void {
    this.previewCustomers.forEach(c => (c._selected = checked));
  }

  confirmImport(): void {
    const customers = this.previewCustomers.filter(c => c._selected);
    if (!customers.length) { this.message.warning('Chưa chọn khách hàng nào để nhập'); return; }
    this.importLoading = true;
    this.crmService.importCustomers({ customers }).subscribe({
      next: () => {
        this.message.success(`Nhập thành công ${customers.length} khách hàng`);
        this.importLoading = false;
        this.previewVisible = false;
        this.search(1);
      },
      error: () => { this.importLoading = false; },
    });
  }

  importGuideVisible = false;

  get importGuideColumns() {
    return [
      { col: 'A', name: 'Mã KH',          required: false, note: 'Bỏ trống khi nhập mới, hệ thống tự sinh' },
      { col: 'B', name: 'Tên khách hàng', required: true,  note: 'Tên đầy đủ của khách hàng' },
      { col: 'C', name: 'Phân loại',      required: false, note: this.typeOptions.length ? this.typeOptions.join(' / ') : 'Customer / Prospect / Lead' },
      { col: 'D', name: 'Email',          required: false, note: '' },
      { col: 'E', name: 'Điện thoại',     required: false, note: '' },
      { col: 'F', name: 'Ngành nghề',     required: false, note: this.industryOptions.length ? this.industryOptions.slice(0, 3).join(', ') + '…' : 'VD: Technology, Retail, Finance…' },
      { col: 'G', name: 'Trạng thái',     required: false, note: this.statusOptions.length ? this.statusOptions.join(' / ') : 'Active / Inactive / Pending' },
      { col: 'H', name: 'Nguồn',          required: false, note: this.sourceOptions.length ? this.sourceOptions.join(' / ') : 'Nguồn khách hàng (Lead source)' },
      { col: 'I', name: 'Ghi chú',        required: false, note: '' },
    ];
  }

  exportCustomers(): void {
    this.exportLoading = true;
    this.crmService.exportCustomers(this.buildFilter()).subscribe({
      next: (data: CrmCustomerDto[]) => {
        this.generateExcel(data ?? [], `khach-hang-${new Date().toISOString().slice(0, 10)}.xlsx`)
          .finally(() => { this.exportLoading = false; });
      },
      error: () => { this.exportLoading = false; },
    });
  }

  downloadTemplate(): void {
    this.generateExcel([], 'template-khach-hang.xlsx');
  }

  private async generateExcel(data: CrmCustomerDto[], filename: string): Promise<void> {
    const { Workbook } = await import('exceljs');
    const wb = new Workbook();
    const ws = wb.addWorksheet('Khách hàng');

    const COLS: { header: string; key: keyof CrmCustomerDto; minWidth: number }[] = [
      { header: 'Mã KH',         key: 'code',         minWidth: 14 },
      { header: 'Tên khách hàng',key: 'name',         minWidth: 28 },
      { header: 'Phân loại',     key: 'customerType', minWidth: 14 },
      { header: 'Email',         key: 'email',        minWidth: 24 },
      { header: 'Điện thoại',    key: 'phone',        minWidth: 14 },
      { header: 'Ngành nghề',    key: 'industry',     minWidth: 18 },
      { header: 'Trạng thái',    key: 'status',       minWidth: 13 },
      { header: 'Nguồn',         key: 'leadSource',   minWidth: 14 },
      { header: 'Ghi chú',       key: 'note',         minWidth: 30 },
    ];

    ws.columns = COLS.map(c => ({ header: c.header, key: c.key as string, width: c.minWidth }));

    // ── Header styling ──
    const headerRow = ws.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } };
      cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FF0050B3' } },
        left:   { style: 'thin', color: { argb: 'FF0050B3' } },
        bottom: { style: 'thin', color: { argb: 'FF0050B3' } },
        right:  { style: 'thin', color: { argb: 'FF0050B3' } },
      };
    });

    // ── Data rows ──
    data.forEach((c, idx) => {
      const row = ws.addRow(COLS.reduce((acc, col) => ({ ...acc, [col.key]: c[col.key] ?? '' }), {} as any));
      row.height = 22;
      const fillColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF0F7FF';
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.font = { size: 10, name: 'Calibri' };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top:    { style: 'hair', color: { argb: 'FFD9D9D9' } },
          left:   { style: 'hair', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'hair', color: { argb: 'FFD9D9D9' } },
          right:  { style: 'hair', color: { argb: 'FFD9D9D9' } },
        };
      });
    });

    // ── Auto column width (fit to content) ──
    ws.columns.forEach((col, i) => {
      const minW = COLS[i].minWidth;
      let maxLen = COLS[i].header.length;
      col.eachCell?.({ includeEmpty: false }, cell => {
        const len = cell.value?.toString().length ?? 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.max(minW, Math.min(maxLen + 3, 60));
    });

    // ── Freeze header row ──
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  triggerImport(): void {
    (document.getElementById('crm-import-file') as HTMLInputElement)?.click();
  }

  async onImportFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    let customers: CrmCustomerDto[] = [];
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      customers = await this.parseExcel(file);
    } else {
      customers = await this.parseCsvFile(file);
    }

    if (!customers.length) {
      this.message.warning('Không tìm thấy dữ liệu hợp lệ trong file (cần có cột Tên khách hàng)');
      return;
    }

    this.previewCustomers = customers.map(c => ({ ...c, _selected: true }));
    this.previewVisible = true;
  }

  private async parseExcel(file: File): Promise<CrmCustomerDto[]> {
    const { Workbook } = await import('exceljs');
    const wb = new Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    const result: CrmCustomerDto[] = [];
    ws.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const val = (col: number) => row.getCell(col).value?.toString().trim() ?? '';
      const dto = new CrmCustomerDto();
      // col index matches COLS order: 1=Mã, 2=Tên, 3=Phân loại, 4=Email, 5=Điện thoại, 6=Ngành, 7=Trạng thái, 8=Nguồn, 9=Ghi chú
      dto.name         = val(2);
      dto.customerType = val(3);
      dto.email        = val(4);
      dto.phone        = val(5);
      dto.industry     = val(6);
      dto.status       = val(7);
      dto.leadSource   = val(8);
      dto.note         = val(9);
      if (dto.name) result.push(dto);
    });
    return result;
  }

  private parseCsvFile(file: File): Promise<CrmCustomerDto[]> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(this.parseCsvText(reader.result as string));
      reader.readAsText(file, 'UTF-8');
    });
  }

  private parseCsvText(text: string): CrmCustomerDto[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const parseLine = (line: string): string[] => {
      const result: string[] = []; let cur = ''; let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
        else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
        else { cur += ch; }
      }
      result.push(cur); return result;
    };
    return lines.slice(1).map(line => {
      const c = parseLine(line);
      const dto = new CrmCustomerDto();
      dto.name = c[1]?.trim() ?? ''; dto.customerType = c[2]?.trim() ?? '';
      dto.email = c[3]?.trim() ?? ''; dto.phone = c[4]?.trim() ?? '';
      dto.industry = c[5]?.trim() ?? ''; dto.status = c[6]?.trim() ?? '';
      dto.leadSource = c[7]?.trim() ?? ''; dto.note = c[8]?.trim() ?? '';
      return dto;
    }).filter(d => !!d.name);
  }

  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '720px';
  }

  pageIndexChange(page: number): void { this.search(page); }
  pageSizeChange(size: number): void { this.pageSize = size; this.search(1); }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  getAvatarColor(name: string): string {
    const colors = ['#4f8ef7', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  formatRevenue(v: number | null | undefined): string {
    if (!v) return '–';
    return '$' + new Intl.NumberFormat('en-US').format(v);
  }

  getTypeColor(type: string): string {
    const m: Record<string, string> = { INDIVIDUAL: 'cyan', COMPANY: 'purple' };
    return m[type] ?? 'default';
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = { Active: 'green', Inactive: 'default', Pending: 'orange' };
    return m[status] ?? 'default';
  }
}
