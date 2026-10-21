import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { HrmTrainingService } from '../../services';
import { HrmTrainingCourseDto, HrmTrainingEnrollmentDto } from '../../models';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-hrm-training',
  imports: [SharedModules],
  templateUrl: './hrm-training.html',
  styleUrl: './hrm-training.scss'
})
export class HrmTraining implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: HrmTrainingCourseDto = new HrmTrainingCourseDto();
  filter: HrmTrainingCourseDto = new HrmTrainingCourseDto();
  statuses = [
    { value: 'PLANNED', label: 'Kế hoạch', color: 'default' },
    { value: 'ONGOING', label: 'Đang diễn ra', color: 'processing' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã huỷ', color: 'red' }
  ];

  constructor(private global: GlobalService, private service: HrmTrainingService, private message: NzMessageService) {
    this.global.setBreadcrumb([{ name: 'Đào tạo', path: 'hrm/training' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.searchCourses(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }
  statusInfo(s: string) { return this.statuses.find(x => x.value === s) || { label: s, color: 'default' }; }

  open(item: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit && item?.id) {
      this.service.detailCourse(item.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res || new HrmTrainingCourseDto(); this.visible = true; }
      });
    } else {
      this.dto = new HrmTrainingCourseDto();
      this.visible = true;
    }
  }

  close() { this.visible = false; this.dto = new HrmTrainingCourseDto(); }

  save() {
    if (!this.dto.code || !this.dto.name || !this.dto.fromDate || !this.dto.toDate) {
      this.message.warning('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }
    const action = this.isEdit ? 'updateCourse' : 'insertCourse';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new HrmTrainingCourseDto(); }
    });
  }

  remove(item: any) {
    this.service.deleteCourse(item.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.search() });
  }

  reset() { this.filter = new HrmTrainingCourseDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
