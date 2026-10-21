import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core';
import { PaginationResult } from '../../../../shared/models';
import { FieldsDto } from '../../models/fields.model';
import { FieldsService } from '../../services/fields.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';

@Component({
  selector: 'app-fields',
  imports: [SharedModules],
  templateUrl: './fields.html',
  styleUrl: './fields.scss',
})
export class Fields implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: FieldsDto = new FieldsDto();
  filter: FieldsDto = new FieldsDto();

  constructor(private global: GlobalService, private service: FieldsService) {
    this.global.setBreadcrumb([{ name: 'Lĩnh vực văn bản', path: 'master-data/document-field' }]);
  }

  ngOnInit(): void { this.search(); }
  search(): void {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }
  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }
  trackById(_index: number, item: any): any { return item.id || item.code; }
  open(data: any, isEdit: boolean): void {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else { this.visible = true; this.dto = new FieldsDto(); }
  }
  close(): void { this.visible = false; this.dto = new FieldsDto(); }
  save(): void {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new FieldsDto(); }
    });
  }
  reset(): void { this.filter = new FieldsDto(); this.search(); }
  pageIndexChange(e: number): void { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: number): void { this.filter.pageSize = e; this.search(); }
  ngOnDestroy(): void { this.global.setBreadcrumb([]); this.destroy$.next(); this.destroy$.complete(); }
}