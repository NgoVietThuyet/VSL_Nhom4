import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { IssuingOrgService } from '../../services/issuing-org.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { IssuingOrgDto } from '../../models/issuing-org.model';

@Component({
  selector: 'app-issuing-org',
  imports: [SharedModules],
  templateUrl: './issuing-org.html'
})
export class IssuingOrg implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  data: PaginationResult = new PaginationResult();
  dto: IssuingOrgDto = new IssuingOrgDto();
  filter: IssuingOrgDto = new IssuingOrgDto();

  constructor(
    private global: GlobalService,
    private service: IssuingOrgService,
    private modal: NzModalService
  ) {
    this.global.setBreadcrumb([
      {
        name: 'Cơ quan ban hành',
        path: 'master-data/issuing-org',
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
          this.data = res;
        }
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
            this.dto = res;
            this.visible = true;
          }
        });
    } else {
      this.visible = true;
      this.dto = new IssuingOrgDto();
    }
  }

  close() {
    this.visible = false;
    this.dto = new IssuingOrgDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.search();
          if (!this.isEdit) this.dto = new IssuingOrgDto();
        }
      });
  }

  reset() {
    this.filter = new IssuingOrgDto();
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
