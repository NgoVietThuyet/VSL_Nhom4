import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalService } from '../../../../core/services/global.service';
import { MessageService } from '../../services/message.service';
import { Subject, takeUntil } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { MessageDto } from '../../models';

@Component({
  selector: 'app-message-system',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './message-system.html',
})
export class MessageSystem implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  data: PaginationResult = new PaginationResult();
  dto: MessageDto = new MessageDto();
  filter: MessageDto = new MessageDto();

  constructor(private global: GlobalService, private service: MessageService) {
    this.global.setBreadcrumb([
      {
        name: 'Thông báo hệ thống',
        path: 'system-manager/message-system',
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
      this.dto = new MessageDto();
    }
  }

  close() {
    this.visible = false;
    this.dto = new MessageDto();
  }

  save() {
    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.search();
          if (!this.isEdit) this.dto = new MessageDto();
        }
      })
  }

  reset() {
    this.filter = new MessageDto();
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
