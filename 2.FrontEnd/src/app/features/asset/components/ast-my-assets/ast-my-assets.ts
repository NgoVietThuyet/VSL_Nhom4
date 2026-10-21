import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { PaginationResult } from '../../../../shared/models';
import { AstAssetService } from '../../services';
import { AstAssetDto } from '../../models';

@Component({
  selector: 'app-ast-my-assets',
  imports: [SharedModules],
  templateUrl: './ast-my-assets.html'
})
export class AstMyAssets implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  data: PaginationResult = new PaginationResult();
  filter: AstAssetDto = new AstAssetDto();

  constructor(private global: GlobalService, private service: AstAssetService) {
    this.global.setBreadcrumb([{ name: 'Tài sản của tôi', path: 'asset/my-assets' }]);
  }

  ngOnInit(): void { this.search(); }

  search() {
    this.service.searchMine(this.filter).pipe(takeUntil(this.destroy$)).subscribe({ next: (res: any) => this.data = res });
  }

  trackById(_: number, item: any) { return item.id; }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); this.search(); }
  }

  pageIndexChange(e: any) { this.filter.currentPage = e; this.search(); }
  pageSizeChange(e: any) { this.filter.pageSize = e; this.search(); }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
