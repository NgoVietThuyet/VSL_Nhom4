import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { AstAssetService, AstLicenseService } from '../../services';
import { AstDashboardSummaryDto, AstLicenseDto } from '../../models';

interface StatusSegment { label: string; color: string; count: number; pct: number; }
interface DonutSegment { path: string; color: string; label: string; count: number; }
interface CategoryBar { name: string; count: number; width: number; color: string; }

@Component({
  selector: 'app-ast-dashboard',
  imports: [SharedModules],
  templateUrl: './ast-dashboard.html',
  styleUrl: './ast-dashboard.scss'
})
export class AstDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  summary: AstDashboardSummaryDto = new AstDashboardSummaryDto();
  expiring: AstLicenseDto[] = [];

  emptyFmt = () => '';

  private readonly catColors = [
    '#1890ff', '#52c41a', '#fa8c16', '#722ed1',
    '#eb2f96', '#13c2c2', '#ff4d4f', '#faad14'
  ];

  constructor(private global: GlobalService, private assetSvc: AstAssetService, private licSvc: AstLicenseService) {
    this.global.setBreadcrumb([{ name: 'Tổng quan tài sản', path: 'asset/dashboard' }]);
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.assetSvc.dashboard().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.summary = res || new AstDashboardSummaryDto(); }
    });
    this.licSvc.expiringSoon(30).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.expiring = res || []; }
    });
  }

  // ── Percentage helpers ────────────────────────────────────────────────────
  inUsePct(): number {
    return this.summary.totalAssets > 0
      ? Math.round(this.summary.inUse / this.summary.totalAssets * 100) : 0;
  }

  availablePct(): number {
    return this.summary.totalAssets > 0
      ? Math.round(this.summary.available / this.summary.totalAssets * 100) : 0;
  }

  depreciationPct(): number {
    return this.summary.totalPurchaseValue > 0
      ? Math.min(100, Math.round(this.summary.totalAccumulatedDepreciation / this.summary.totalPurchaseValue * 100)) : 0;
  }

  bookValuePct(): number {
    return this.summary.totalPurchaseValue > 0
      ? Math.min(100, Math.round(this.summary.totalBookValue / this.summary.totalPurchaseValue * 100)) : 0;
  }

  // ── Status items for detail list ──────────────────────────────────────────
  statusItems(): StatusSegment[] {
    const total = this.summary.totalAssets || 1;
    return [
      { label: 'Đang sử dụng', color: '#0078d4', count: this.summary.inUse,        pct: Math.round(this.summary.inUse        / total * 100) },
      { label: 'Sẵn sàng',     color: '#52c41a', count: this.summary.available,    pct: Math.round(this.summary.available    / total * 100) },
      { label: 'Bảo trì',      color: '#fa8c16', count: this.summary.maintenance,  pct: Math.round(this.summary.maintenance  / total * 100) },
      { label: 'Hỏng',         color: '#ff4d4f', count: this.summary.broken,       pct: Math.round(this.summary.broken       / total * 100) },
      { label: 'Thanh lý',     color: '#8c8c8c', count: this.summary.disposed,     pct: Math.round(this.summary.disposed     / total * 100) },
    ];
  }

  // ── Donut chart SVG paths ─────────────────────────────────────────────────
  statusDonut(): DonutSegment[] {
    const items = this.statusItems().filter(s => s.count > 0);
    const total = items.reduce((s, x) => s + x.count, 0);
    if (total === 0) return [];

    const cx = 60, cy = 60, r = 52, ri = 32;
    let angle = -Math.PI / 2;

    return items.map(seg => {
      const sweep = (seg.count / total) * 2 * Math.PI;
      const end = angle + sweep;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const ix1 = cx + ri * Math.cos(end);
      const iy1 = cy + ri * Math.sin(end);
      const ix2 = cx + ri * Math.cos(angle);
      const iy2 = cy + ri * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M${f(x1)},${f(y1)} A${r},${r} 0 ${large} 1 ${f(x2)},${f(y2)} L${f(ix1)},${f(iy1)} A${ri},${ri} 0 ${large} 0 ${f(ix2)},${f(iy2)} Z`;
      angle = end;
      return { path, color: seg.color, label: seg.label, count: seg.count };
    });
  }

  // ── Category bar chart ────────────────────────────────────────────────────
  categoryBars(): CategoryBar[] {
    const data: any[] = this.summary.byCategory || [];
    const maxCount = Math.max(...data.map(x => x.count || 0), 1);
    return data.map((x, i) => ({
      name:  x.name || x.categoryName || '—',
      count: x.count || 0,
      width: Math.round(((x.count || 0) / maxCount) * 100),
      color: this.catColors[i % this.catColors.length]
    }));
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next(); this.destroy$.complete();
  }
}

function f(n: number): string { return n.toFixed(2); }
