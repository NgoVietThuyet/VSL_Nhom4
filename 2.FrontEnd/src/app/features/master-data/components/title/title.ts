import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { TitleService } from '../../services/title.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FileService } from '../../../../shared/services/file.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { TitleDto } from '../../models/title.model';

@Component({
  selector: 'app-title',
  imports: [SharedModules],
  templateUrl: './title.html'
})
export class Title implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  form = new FormData()
  data: PaginationResult = new PaginationResult();
  dto: TitleDto = new TitleDto();
  filter: TitleDto = new TitleDto();
  isVisible = false

  constructor(
    private global: GlobalService,
    private service: TitleService,
    private fileS: FileService,
    private modal: NzModalService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Chức danh',
        path: 'master-data/title',
      },
    ]);
  }

  ngOnInit(): void {
    this.search();
  }

  search() {
    this.service.search(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res
        }
      })
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.search();
    }
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.detail(data.code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res
            this.visible = true;
          }
        })
    }
    else {
      this.visible = true;
      this.dto = new TitleDto();
    }
  }

  close() {
    this.visible = false;
    this.dto = new TitleDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.search();
          if (!this.isEdit) this.dto = new TitleDto();
        }
      })
  }

  reset() {
    this.filter = new TitleDto();
    this.search();
  }

  pageIndexChange(e: any) {
    this.filter.currentPage = e;
    this.search();
  }

  pageSizeChange(e: any) {
    this.filter.pageSize = e;
    this.search();
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}

