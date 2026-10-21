import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmRewardService } from '../../services';
import { HrmRewardDto } from '../../models';

@Component({
  selector: 'app-hrm-reward',
  imports: [SharedModules],
  templateUrl: './hrm-reward.html',
  styleUrls: ['./hrm-reward.scss']
})
export class HrmReward implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmRewardDto = new HrmRewardDto();
  filter: HrmRewardDto = new HrmRewardDto();
  types = [
    { value: 'REWARD', label: 'Khen thưởng', color: 'green' },
    { value: 'DISCIPLINE', label: 'Kỷ luật', color: 'red' }
  ];
  statuses = [
    { value: 'DRAFT', label: 'Nháp', color: 'default' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'REJECTED', label: 'Từ chối', color: 'red' }
  ];

  constructor(private global: GlobalService, private service: HrmRewardService) {
    this.global.setBreadcrumb([{ name: 'Khen thưởng – Kỷ luật', path: 'hrm/reward' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  typeInfo(t: string) { return this.types.find(x => x.value === t) || { label: t, color: 'default' }; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detail(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res || new HrmRewardDto(); this.visible = true; }
      });
    } else {
      this.dto = new HrmRewardDto();
      this.visible = true;
    }
  }

  close() { this.visible = false; this.dto = new HrmRewardDto(); }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new HrmRewardDto(); }
    });
  }

  remove(item: any) {
    this.service.delete(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new HrmRewardDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
