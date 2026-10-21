import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmProductDto, CrmQuotationActionDto, CrmQuotationDto, CrmQuotationItemDto } from '../../models';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-quotation-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-quotation-editor.html',
  styleUrls: ['./crm-quotation-editor.scss'],
})
export class CrmQuotationEditor implements OnInit {
  quotations: CrmQuotationDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  filterForm: FormGroup;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo báo giá';
  drawerLoading = false;
  quotationForm: FormGroup;
  lineItems: CrmQuotationItemDto[] = [];

  statusOptions = ['Draft', 'Sent', 'Approved', 'Rejected', 'Converted'];
  productList: CrmProductDto[] = [];
  productsLoading = false;

  constructor(private fb: FormBuilder, private svc: CrmService, private msg: NzMessageService) {
    this.filterForm = this.fb.group({ keyWord: [''], status: [''] });
    this.quotationForm = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      name: [''],
      customerId: [''],
      opportunityId: [''],
      status: ['Draft'],
      validUntil: [null],
      ownerUser: [''],
      note: [''],
      currency: ['VND'],
    });
  }

  ngOnInit(): void { this.search(); }

  private buildFilter(): any {
    return { ...this.filterForm.value, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.svc.searchQuotations(this.buildFilter()).subscribe({
      next: (res) => {
        const paged = res?.data;
        this.quotations = paged?.data ?? [];
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
    this.drawerTitle = 'Tạo báo giá';
    this.quotationForm.reset({ status: 'Draft', currency: 'VND' });
    this.lineItems = [];
    this.loadProducts();
    this.drawerVisible = true;
  }

  openEdit(q: CrmQuotationDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật báo giá';
    this.quotationForm.patchValue({ ...q, validUntil: q.validUntil ? new Date(q.validUntil) : null });
    this.lineItems = q.items?.map(i => ({ ...i })) ?? [];
    this.loadProducts();
    this.drawerVisible = true;
  }

  private loadProducts(): void {
    if (this.productList.length > 0) return;
    this.productsLoading = true;
    this.svc.searchProducts({ pageSize: 1000, currentPage: 1, isActive: true } as any).subscribe({
      next: (res) => {
        this.productList = res?.data?.data ?? [];
        this.productsLoading = false;
      },
      error: () => { this.productsLoading = false; },
    });
  }

  onProductSelect(item: CrmQuotationItemDto, productId: string): void {
    const product = this.productList.find(p => p.id === productId);
    if (!product) return;
    if (!item.description) item.description = product.name;
    item.unitPrice = product.unitPrice;
    this.recalcLineItem(item);
  }

  closeDrawer(): void { this.drawerVisible = false; }

  addLineItem(): void {
    this.lineItems = [...this.lineItems, new CrmQuotationItemDto()];
  }

  removeLineItem(index: number): void {
    this.lineItems = this.lineItems.filter((_, i) => i !== index);
  }

  recalcLineItem(item: CrmQuotationItemDto): void {
    const qty = item.quantity ?? 0;
    const price = item.unitPrice ?? 0;
    const disc = item.discount ?? 0;
    item.amount = qty * price - disc;
  }

  get totalAmount(): number { return this.lineItems.reduce((s, i) => s + (i.amount ?? 0), 0); }
  get discountAmount(): number { return this.lineItems.reduce((s, i) => s + (i.discount ?? 0), 0); }
  get netAmount(): number { return this.totalAmount - this.discountAmount; }

  submitForm(): void {
    if (this.quotationForm.invalid) {
      Object.values(this.quotationForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.drawerLoading = true;
    const { id, ...rest } = this.quotationForm.value;
    const val = (this.drawerMode === 'create' ? rest : { id, ...rest }) as CrmQuotationDto;
    val.items = this.lineItems;
    val.totalAmount = this.totalAmount;
    val.discountAmount = this.discountAmount;
    val.netAmount = this.netAmount;
    const action$ = this.drawerMode === 'create' ? this.svc.createQuotation(val) : this.svc.updateQuotation(val);
    action$.subscribe({
      next: () => {
        this.msg.success(this.drawerMode === 'create' ? 'Tạo báo giá thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteQuotation(q: CrmQuotationDto): void {
    this.svc.deleteQuotation(q.id).subscribe({
      next: () => { this.msg.success('Xóa báo giá thành công'); this.search(this.currentPage); },
    });
  }

  sendQuotation(q: CrmQuotationDto): void {
    this.svc.sendQuotation(q.id, new CrmQuotationActionDto()).subscribe({
      next: () => { this.msg.success('Gửi báo giá thành công'); this.search(this.currentPage); },
    });
  }

  approveQuotation(q: CrmQuotationDto): void {
    this.svc.approveQuotation(q.id, new CrmQuotationActionDto()).subscribe({
      next: () => { this.msg.success('Duyệt báo giá thành công'); this.search(this.currentPage); },
    });
  }

  convertQuotation(q: CrmQuotationDto): void {
    this.svc.convertQuotation(q.id, new CrmQuotationActionDto()).subscribe({
      next: () => { this.msg.success('Chuyển đổi thành công'); this.search(this.currentPage); },
    });
  }

  pageIndexChange(p: number): void { this.search(p); }
  pageSizeChange(s: number): void { this.pageSize = s; this.search(1); }

  readonly numberFormatter = (v: number): string =>
    v == null ? '' : v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  readonly numberParser = (v: string): number =>
    Number(v.replace(/\./g, '')) || 0;

  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '720px';
  }

  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = { Draft: 'default', Sent: 'processing', Approved: 'success', Rejected: 'error', Converted: 'purple' };
    return m[status] ?? 'default';
  }
}
