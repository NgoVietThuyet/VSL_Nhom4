import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstDepreciationService } from '../../services';
import { AstDepreciationDto, AstDepreciationRunRequestDto } from '../../models';

@Component({
  selector: 'app-ast-depreciation',
  imports: [SharedModules],
  templateUrl: './ast-depreciation.html'
})
export class AstDepreciation implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  visible = false;
  data: PaginationResult = new PaginationResult();
  filter: AstDepreciationDto = new AstDepreciationDto();
  runDto: AstDepreciationRunRequestDto = new AstDepreciationRunRequestDto();

  constructor(private global: GlobalService, private service: AstDepreciationService) {
    this.global.setBreadcrumb([{ name: 'Khấu hao', path: 'asset/depreciation' }]);
  }

  ngOnInit(): void {
    const now = new Date();
    this.runDto.periodYear = now.getFullYear();
    this.runDto.periodMonth = now.getMonth() + 1;
    this.runDto.periodCode = `${this.runDto.periodYear}-${String(this.runDto.periodMonth).padStart(2, '0')}`;
    this.search();
  }

  search() {
    this.service.search(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  trackById(_: number, item: any) { return item.id; }

  openRun() {
    const now = new Date();
    this.runDto = new AstDepreciationRunRequestDto();
    this.runDto.periodYear = now.getFullYear();
    this.runDto.periodMonth = now.getMonth() + 1;
    this.runDto.periodCode = `${this.runDto.periodYear}-${String(this.runDto.periodMonth).padStart(2, '0')}`;
    this.visible = true;
  }
  close() { this.visible = false; }

  run() {
    this.runDto.periodCode = `${this.runDto.periodYear}-${String(this.runDto.periodMonth).padStart(2, '0')}`;
    this.service.run(this.runDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.visible = false; this.filter.periodCode = this.runDto.periodCode; this.search(); }
    });
  }

  reset() { this.filter = new AstDepreciationDto(); this.search(); }
  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
