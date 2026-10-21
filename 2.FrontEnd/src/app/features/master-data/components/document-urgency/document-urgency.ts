import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { DocumentUrgencyService } from '../../services/document-urgency.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { DocumentUrgencyDto } from '../../models/document-urgency.model';

@Component({
  selector: 'app-document-urgency',
  imports: [SharedModules],
  templateUrl: './document-urgency.html'
})
export class DocumentUrgency implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: DocumentUrgencyDto = new DocumentUrgencyDto();
  filter: DocumentUrgencyDto = new DocumentUrgencyDto();

  constructor(private global: GlobalService, private service: DocumentUrgencyService) {
    this.global.setBreadcrumb([{ name: 'Độ khẩn', path: 'master-data/document-urgency' }]);
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
    } else { this.visible = true; this.dto = new DocumentUrgencyDto(); }
  }
  close(): void { this.visible = false; this.dto = new DocumentUrgencyDto(); }
  save(): void {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new DocumentUrgencyDto(); }
    });
  }
  reset(): void { this.filter = new DocumentUrgencyDto(); this.search(); }
  pageIndexChange(e: number): void { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: number): void { this.filter.pageSize = e; this.search(); }
  ngOnDestroy(): void { this.global.setBreadcrumb([]); this.destroy$.next(); this.destroy$.complete(); }
}
