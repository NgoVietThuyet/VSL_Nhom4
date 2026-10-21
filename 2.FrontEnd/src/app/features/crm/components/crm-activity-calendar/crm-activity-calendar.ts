import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { CrmActivityFullDto } from '../../models';
import { CrmService } from '../../services/crm.service';

@Component({
  selector: 'app-crm-activity-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModules],
  templateUrl: './crm-activity-calendar.html',
  styleUrls: ['./crm-activity-calendar.scss'],
})
export class CrmActivityCalendar implements OnInit {
  filterForm: FormGroup;
  activities: CrmActivityFullDto[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  loading = false;

  drawerVisible = false;
  drawerMode: 'create' | 'edit' = 'create';
  drawerTitle = 'Tạo hoạt động';
  drawerLoading = false;
  activityForm: FormGroup;

  typeOptions = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'];
  statusOptions = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  constructor(private fb: FormBuilder, private svc: CrmService, private msg: NzMessageService) {
    this.filterForm = this.fb.group({ keyWord: [''], activityType: [''], status: [''] });
    this.activityForm = this.fb.group({
      id: [''],
      activityType: ['CALL', [Validators.required]], 
      subject: ['', [Validators.required]],
      description: [''],
      relatedType: [''],
      relatedId: [''],
      ownerUser: [''],
      startTime: [null],
      endTime: [null],
      status: ['PLANNED'], 
    });
  }

  ngOnInit(): void { this.search(); }

  private buildFilter(): any {
    return { ...this.filterForm.value, currentPage: this.currentPage, pageSize: this.pageSize, isActive: true };
  }

  search(page = 1): void {
    this.currentPage = page;
    this.loading = true;
    this.svc.searchActivities(this.buildFilter()).subscribe({
      next: (res) => {
        const paged = res?.data;
        this.activities = paged?.data ?? [];
        this.total = paged?.totalRecord ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  resetFilters(): void {
    this.filterForm.reset({ keyWord: '', activityType: '', status: '' });
    this.search(1);
  }

  openCreate(): void {
    this.drawerMode = 'create';
    this.drawerTitle = 'Tạo hoạt động';
    this.activityForm.reset({ activityType: 'CALL', status: 'PLANNED' });
    this.drawerVisible = true;
  }

  openEdit(item: CrmActivityFullDto): void {
    this.drawerMode = 'edit';
    this.drawerTitle = 'Cập nhật hoạt động';
    this.activityForm.patchValue({
      ...item,
      startTime: item.startTime ? new Date(item.startTime) : null,
      endTime: item.endTime ? new Date(item.endTime) : null,
    });
    this.drawerVisible = true;
  }

  closeDrawer(): void { this.drawerVisible = false; }

  submitForm(): void {
    if (this.activityForm.invalid) {
      Object.values(this.activityForm.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.drawerLoading = true;
    const val = { ...this.activityForm.value } as CrmActivityFullDto;
    if (!val.id) val.id = crypto.randomUUID();
    const action$ = this.drawerMode === 'create' ? this.svc.createActivity(val) : this.svc.updateActivity(val);
    action$.subscribe({
      next: () => {
        this.msg.success(this.drawerMode === 'create' ? 'Tạo hoạt động thành công' : 'Cập nhật thành công');
        this.drawerVisible = false;
        this.drawerLoading = false;
        this.search(this.currentPage);
      },
      error: () => { this.drawerLoading = false; },
    });
  }

  deleteActivity(item: CrmActivityFullDto): void {
    this.svc.deleteActivity(item.id).subscribe({
      next: () => { this.msg.success('Xóa hoạt động thành công'); this.search(this.currentPage); },
    });
  }

  pageIndexChange(page: number): void { this.search(page); }
  pageSizeChange(size: number): void { this.pageSize = size; this.search(1); }

  get drawerWidth(): string {
    return window.innerWidth <= 600 ? '100vw' : window.innerWidth <= 900 ? '90vw' : '720px';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = { CALL: 'blue', EMAIL: 'cyan', MEETING: 'purple', TASK: 'orange', NOTE: 'green' };
    return map[type] ?? 'default';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { PLANNED: 'default', IN_PROGRESS: 'processing', COMPLETED: 'success', CANCELLED: 'error' };
    return map[status] ?? 'default';
  }
}
