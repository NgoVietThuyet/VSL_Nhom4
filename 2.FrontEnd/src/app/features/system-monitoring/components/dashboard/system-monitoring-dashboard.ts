import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { SignalRService } from '../../../../shared/services/signalr.service';
import { SystemMonitorService } from '../../services/system-monitor.service';
import { SystemMonitorSnapshot, DiskInfo, ServiceHealth } from '../../models/system-monitor.model';

@Component({
  selector: 'app-system-monitoring-dashboard',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './system-monitoring-dashboard.html',
  styleUrl: './system-monitoring-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemMonitoringDashboard implements OnInit, OnDestroy {
  snapshot: SystemMonitorSnapshot | null = null;
  isLoading = true;
  isLive = false;
  lastUpdateTime: Date | null = null;
  lastUpdateAgo = '';

  cpuHistory: number[] = [];
  memHistory: number[] = [];
  connHistory: number[] = [];
  netRecvHistory: number[] = [];
  netSentHistory: number[] = [];
  rpsHistory: number[] = [];
  private readonly maxHistory = 60;

  private subs = new Subscription();
  private agoTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private monitorService: SystemMonitorService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.subscribeToRealtime();
    this.startAgoTimer();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.agoTimer) clearInterval(this.agoTimer);
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.subs.add(
      this.monitorService.getHistory().subscribe({
        next: (history) => {
          if (history?.length) {
            this.snapshot = history[history.length - 1];
            history.forEach(s => this.pushHistory(s));
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => this.loadSnapshot()
      })
    );
  }

  loadSnapshot(): void {
    this.subs.add(
      this.monitorService.getSnapshot().subscribe({
        next: (s) => { this.applySnapshot(s); this.isLoading = false; this.cdr.markForCheck(); },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      })
    );
  }

  refresh(): void { this.loadSnapshot(); }

  subscribeToRealtime(): void {
    this.subs.add(
      this.signalRService.systemMonitorEvent$.subscribe(data => {
        this.isLive = true;
        this.applySnapshot(data as SystemMonitorSnapshot);
        this.cdr.markForCheck();
      })
    );
  }

  private applySnapshot(s: SystemMonitorSnapshot): void {
    this.snapshot = s;
    this.lastUpdateTime = new Date();
    this.lastUpdateAgo = 'vừa xong';
    this.pushHistory(s);
  }

  private pushHistory(s: SystemMonitorSnapshot): void {
    this.cpuHistory      = this.trim([...this.cpuHistory,      s.cpuUsagePercent]);
    this.memHistory      = this.trim([...this.memHistory,      s.memoryUsagePercent]);
    this.connHistory     = this.trim([...this.connHistory,     s.activeConnections]);
    this.netRecvHistory  = this.trim([...this.netRecvHistory,  s.network?.bytesReceivedPerSec ?? 0]);
    this.netSentHistory  = this.trim([...this.netSentHistory,  s.network?.bytesSentPerSec ?? 0]);
    this.rpsHistory      = this.trim([...this.rpsHistory,      s.httpStats?.requestsPerSecond ?? 0]);
  }

  private trim(arr: number[]): number[] {
    return arr.length > this.maxHistory ? arr.slice(arr.length - this.maxHistory) : arr;
  }

  private startAgoTimer(): void {
    this.agoTimer = setInterval(() => {
      if (!this.lastUpdateTime) return;
      const s = Math.floor((Date.now() - this.lastUpdateTime.getTime()) / 1000);
      this.lastUpdateAgo = s < 5 ? 'vừa xong' : s < 60 ? `${s}s trước` : `${Math.floor(s / 60)}m trước`;
      this.cdr.markForCheck();
    }, 1000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatBytes(bytes: number, dec = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(dec)} ${sizes[i]}`;
  }

  formatBps(bps: number): string {
    return `${this.formatBytes(bps)}/s`;
  }

  cpuColor(v: number)  { return v >= 90 ? '#ff4d4f' : v >= 70 ? '#fa8c16' : '#52c41a'; }
  memColor(v: number)  { return v >= 85 ? '#ff4d4f' : v >= 65 ? '#fa8c16' : '#1890ff'; }
  diskColor(v: number) { return v >= 90 ? '#ff4d4f' : v >= 75 ? '#fa8c16' : '#0078d4'; }

  progressStatus(v: number): 'success' | 'normal' | 'exception' {
    return v >= 90 ? 'exception' : v >= 70 ? 'normal' : 'success';
  }

  envColor(env: string): string {
    const e = (env ?? '').toLowerCase();
    if (e === 'production') return '#ff4d4f';
    if (e === 'staging')    return '#fa8c16';
    return '#52c41a';
  }

  serviceStatusColor(s: ServiceHealth): string {
    return s.status === 'healthy'   ? 'success'
         : s.status === 'degraded'  ? 'warning'
         : s.status === 'unhealthy' ? 'error'
         : 'default';
  }

  serviceStatusBg(s: ServiceHealth): string {
    return s.status === 'healthy'   ? '#52c41a'
         : s.status === 'degraded'  ? '#fa8c16'
         : s.status === 'unhealthy' ? '#ff4d4f'
         : '#8c8c8c';
  }

  serviceIcon(type: string): string {
    const m: Record<string, string> = {
      database: 'bi-database-fill', cache: 'bi-layers-fill',
      storage: 'bi-cloud-fill', scheduler: 'bi-calendar-check-fill', hub: 'bi-broadcast',
    };
    return m[type] ?? 'bi-plug-fill';
  }

  hangfireColor(n: number, type: 'failed' | 'enqueued' | 'processing'): string {
    if (type === 'failed')     return n > 0 ? '#ff4d4f' : '#52c41a';
    if (type === 'processing') return '#fa8c16';
    return '#1890ff';
  }

  sparklinePoints(vals: number[], w = 260, h = 44, max?: number): string {
    if (!vals || vals.length < 2) return '';
    const mx = max ?? Math.max(...vals, 1);
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - (v / mx) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  sparklineArea(vals: number[], w = 260, h = 44, max?: number): string {
    if (!vals || vals.length < 2) return '';
    const mx = max ?? Math.max(...vals, 1);
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - (v / mx) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${pts[0]} L ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`;
  }

  primaryDisk(): DiskInfo | null {
    if (!this.snapshot?.disks?.length) return null;
    return this.snapshot.disks.find(d => d.name === 'C:\\' || d.name === '/') ?? this.snapshot.disks[0];
  }

  trackByDisk(_: number, d: DiskInfo)     { return d.name; }
  trackBySvc(_: number, s: ServiceHealth) { return s.name; }
  trackByUser(_: number, u: string)       { return u; }

  readonly emptyFormat = (_: number) => '';
}
