import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { TaskPriorityService } from '../../services/task-priority.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { TaskPriorityDto } from '../../models/task-priority.model';

@Component({
  selector: 'app-task-priority',
  imports: [SharedModules],
  templateUrl: './task-priority.html',
})
export class TaskPriority implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: TaskPriorityDto = new TaskPriorityDto();
  filter: TaskPriorityDto = new TaskPriorityDto();

  constructor(private global: GlobalService, private service: TaskPriorityService) {
    this.global.setBreadcrumb([{ name: 'Độ ưu tiên nhiệm vụ', path: 'master-data/task-priority' }]);
  }

  ngOnInit(): void { this.search(); }
  search(): void {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }
  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }
  trackById(_index: number, item: any): any { return item.code; }
  open(data: any, isEdit: boolean): void {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else { this.visible = true; this.dto = new TaskPriorityDto(); }
  }
  close(): void { this.visible = false; this.dto = new TaskPriorityDto(); }
  save(): void {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new TaskPriorityDto(); }
    });
  }
  reset(): void { this.filter = new TaskPriorityDto(); this.search(); }
  pageIndexChange(e: number): void { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: number): void { this.filter.pageSize = e; this.search(); }
  ngOnDestroy(): void { this.global.setBreadcrumb([]); this.destroy$.next(); this.destroy$.complete(); }
}
