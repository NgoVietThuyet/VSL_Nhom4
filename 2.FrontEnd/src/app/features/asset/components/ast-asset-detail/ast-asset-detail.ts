import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { AstAssetService } from '../../services';

@Component({
  selector: 'app-ast-asset-detail',
  imports: [SharedModules],
  templateUrl: './ast-asset-detail.html'
})
export class AstAssetDetail implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  id: string = '';
  detail: any = { info: {}, assignments: [], transfers: [], maintenances: [], depreciations: [], histories: [] };

  constructor(private global: GlobalService, private service: AstAssetService, private route: ActivatedRoute) {
    this.global.setBreadcrumb([{ name: 'Chi tiết tài sản', path: '' }]);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (this.id) this.load();
  }

  load() {
    this.service.detail(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.detail = res || this.detail; }
    });
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}
