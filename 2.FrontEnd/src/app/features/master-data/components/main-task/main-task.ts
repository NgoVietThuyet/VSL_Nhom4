import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { MainTaskDto, MAIN_TASK_STATUS } from '../../models/main-task.model';
import { MainTaskService } from '../../services/main-task.service';
import { OrganizeService } from '../../services/organize.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-main-task',
  imports: [SharedModules],
  templateUrl: './main-task.html',
})
export class MainTask implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  saving = false;
  data: PaginationResult = new PaginationResult();
  dto: MainTaskDto = new MainTaskDto();
  filter: MainTaskDto = new MainTaskDto();
  organizes: any[] = [];
  readonly statusOptions = Object.entries(MAIN_TASK_STATUS).map(([k, v]) => ({
    value: +k,
    label: v.label,
  }));

  constructor(
    private global: GlobalService,
    private service: MainTaskService,
    private organizeService: OrganizeService,
    private notification: NzNotificationService
  ) {
    this.global.setBreadcrumb([
      { name: 'Nhóm nhiệm vụ chuyên đề', path: 'master-data/main-task' },
    ]);
  }

  ngOnInit(): void {
    this.organizeService.search({ isPaging: false } as any).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r: any) => { this.organizes = r?.data ?? r ?? []; },
    });
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }

  search(): void {
    this.filter.isPaging = true;
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res ?? new PaginationResult(); },
    });
  }

  onKeydownSearch(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.search(); }
  }

  trackById = (_: number, x: { id: string }) => x.id;

  open(item: MainTaskDto | null, isEdit: boolean): void {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.dto = this.parseDates(res);
          this.visible = true;
        },
      });
    } else {
      this.dto = new MainTaskDto();
      this.dto.status = 1;
      this.dto.progress = 0;
      this.visible = true;
    }
  }

  close(): void {
    this.visible = false;
    this.dto = new MainTaskDto();
  }

  save(): void {
    if (!this.dto.name?.trim()) {
      this.notification.warning('Cảnh báo','Vui lòng nhập tên nhóm nhiệm vụ');
      return;
    }
    this.saving = true;
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.search();
        if (!this.isEdit) {
          this.dto = new MainTaskDto();
          this.dto.status = 1;
          this.dto.progress = 0;
        }
      },
      error: () => { this.saving = false; },
    });
  }

  pageIndexChange(p: number): void { this.filter.currentPage = p; this.search(); }

  reset(): void {
    this.filter = new MainTaskDto();
    this.search();
  }

  pageSizeChange(s: number): void { this.filter.pageSize = s; this.filter.currentPage = 1; this.search(); }

  getOrgName(id: string | null | undefined): string {
    if (!id) return '';
    return this.organizes.find(o => o.id === id)?.name ?? id;
  }

  getStatusLabel(status: number): string {
    return MAIN_TASK_STATUS[status]?.label ?? String(status);
  }

  getStatusColor(status: number): string {
    return MAIN_TASK_STATUS[status]?.color ?? 'default';
  }

  private parseDates(d: MainTaskDto): MainTaskDto {
    const copy = { ...d };
    if (copy.startDate) copy.startDate = new Date(copy.startDate as string);
    if (copy.deadline) copy.deadline = new Date(copy.deadline as string);
    if (copy.endDate) copy.endDate = new Date(copy.endDate as string);
    return copy;
  }
}
