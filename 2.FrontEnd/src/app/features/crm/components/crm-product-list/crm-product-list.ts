import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmProductDto } from '../../models';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-product-list.html',
  styleUrls: ['./crm-product-list.scss'],
})
export class CrmProductList implements OnInit {
  products: CrmProductDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;
  filterForm: FormGroup;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Thêm sản phẩm';
  drawerLoading = false;
  productForm: FormGroup;

  constructor(private fb: FormBuilder, private svc: CrmService, private msg: NzMessageService) {
    this.filterForm = this.fb.group({ keyWord: [''], isService: [null] });
    this.productForm = this.fb.group({
      id: [''],
      code: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      unitPrice: [null],
      unitOfMeasure: [''],
      isService: [false],
    });
  }

  ngOnInit(): void { this.search(); }

  private buildFilter(): any {
    return { ...this.filterForm.value, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.svc.searchProducts(this.buildFilter()).subscribe({
      next: (res) => {
        const paged = res?.data;
        this.products = paged?.data ?? [];
        this.total = paged?.totalRecord ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ keyWord: '', isService: null });
    this.search(1);
  }

  openCreate(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Thêm sản phẩm';
    this.productForm.reset({ isService: false });
    this.drawerVisible = true;
  }

  openEdit(p: CrmProductDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật sản phẩm';
    this.productForm.patchValue(p);
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitForm(): void {
    if (this.productForm.invalid) {
      Object.values(this.productForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.drawerLoading = true;
    const val = { ...this.productForm.value } as CrmProductDto;
    const action$ = this.drawerMode === 'create' ? this.svc.createProduct(val) : this.svc.updateProduct(val);
    action$.subscribe({
      next: () => {
        this.msg.success(this.drawerMode === 'create' ? 'Thêm sản phẩm thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteProduct(p: CrmProductDto): void {
    this.svc.deleteProduct(p.id).subscribe({
      next: () => { this.msg.success('Xóa sản phẩm thành công'); this.search(this.currentPage); },
    });
  }

  pageIndexChange(p: number): void { this.search(p); }
  pageSizeChange(s: number): void { this.pageSize = s; this.search(1); }

  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '720px';
  }

  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '–';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  }
}
