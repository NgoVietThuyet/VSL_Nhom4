import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { WfInstanceService } from '../../services';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { WfInstanceDto } from '../../models';

@Component({
  selector: 'app-wf-inbox',
  imports: [SharedModules],
  templateUrl: './wf-inbox.html'
})
export class WfInbox implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: PaginationResult = new PaginationResult();
  filter: WfInstanceDto = new WfInstanceDto();
  statuses = [
    { value: 'RUNNING', label: 'Đang chạy' },
    { value: 'RETURNED', label: 'Đã trả lại' }
  ];
  priorities = [
    { value: 'LOW', label: 'Thấp' },
    { value: 'NORMAL', label: 'Bình thường' },
    { value: 'HIGH', label: 'Cao' },
    { value: 'URGENT', label: 'Khẩn cấp' }
  ];

  constructor(private global: GlobalService, private service: WfInstanceService, private router: Router) {
    this.global.setBreadcrumb([{ name: 'Hộp thư xét duyệt', path: 'workflow/inbox' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.inbox(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.data = res; }
    });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  open(item: any) { this.router.navigate(['workflow/detail', item.id]); }
  reset() { this.filter = new WfInstanceDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  statusColor(s: string) {
    switch (s) {
      case 'RUNNING': return 'processing';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'RETURNED': return 'warning';
      case 'CANCELLED': return 'default';
      case 'DRAFT': return 'default';
      default: return 'default';
    }
  }
  priorityColor(p: string) {
    switch (p) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'NORMAL': return 'blue';
      case 'LOW': return 'default';
      default: return 'default';
    }
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
