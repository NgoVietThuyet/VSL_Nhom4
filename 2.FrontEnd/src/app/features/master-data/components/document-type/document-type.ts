import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { DocumentTypeService } from '../../services/document-type.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { DocumentTypeDto } from '../../models/document-type.model';

@Component({
  selector: 'app-document-type',
  imports: [SharedModules],
  templateUrl: './document-type.html'
})
export class DocumentType implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  isEdit = false;
  data: PaginationResult = new PaginationResult();
  dto: DocumentTypeDto = new DocumentTypeDto();
  filter: DocumentTypeDto = new DocumentTypeDto();

  constructor(
    private global: GlobalService,
    private service: DocumentTypeService,
  ) {
    this.global.setBreadcrumb([{ name: 'Loại văn bản', path: 'master-data/document-type' }]);
  }

  ngOnInit(): void { this.search(); }

  search(): void {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => this.data = res
    });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.search();
    }
  }

  trackById(_index: number, item: any): any { return item.id || item.code; }

  open(data: any, isEdit: boolean): void {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => { this.dto = res; this.visible = true; }
      });
    } else {
      this.visible = true;
      this.dto = new DocumentTypeDto();
    }
  }

  close(): void { this.visible = false; this.dto = new DocumentTypeDto(); }

  save(): void {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.search(); if (!this.isEdit) this.dto = new DocumentTypeDto(); }
    });
  }

  reset(): void { this.filter = new DocumentTypeDto(); this.search(); }
  pageIndexChange(e: number): void { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: number): void { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
