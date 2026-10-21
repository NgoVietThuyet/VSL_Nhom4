import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil, filter } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { LogService } from '../../services/log.service';
import { SignalRService } from '../../../../shared/services';

const MAX_LOGS = 500;

export interface ParsedLog {
  timestamp: string;
  level: string;
  logger: string;
  machine: string;
  processId: string;
  threadId: string;
  message: string;
  properties?: string;
  rawLine: string;
}

@Component({
  selector: 'app-log-system',
  imports: [SharedModules],
  templateUrl: './log-system.html',
  styleUrl: './log-system.scss'
})
export class LogSystem implements OnInit, OnDestroy {

  @ViewChild('logContainer') logContainer!: ElementRef<HTMLDivElement>;

  private allLogs: ParsedLog[] = [];
  filteredLogs: ParsedLog[] = [];

  isFullscreen = false;
  isLive = true;
  autoScroll = true;

  selectedLevel = '';
  readonly levelOptions = [
    { label: 'ALL',   value: '' },
    { label: 'INFO',  value: 'INFO' },
    { label: 'WARN',  value: 'WARN' },
    { label: 'ERROR', value: 'ERROR' },
    { label: 'DEBUG', value: 'DEBUG' },
    { label: 'FATAL', value: 'FATAL' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private service: LogService,
    private signalR: SignalRService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadInitialLogs();
    this.subscribeToRealtime();
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalR.leaveLogWatchers();
  }

  loadInitialLogs(): void {
    this.service.search(200).subscribe({
      next: (res: any) => {
        const lines: string[] = Array.isArray(res) ? res : [];
        this.allLogs = lines.map(l => this.parseLog(l));
        this.applyFilter();
        this.scrollToBottomIfAuto();
      }
    });
  }

  private subscribeToRealtime(): void {
    // Thử join ngay nếu SignalR đã connected
    this.signalR.joinLogWatchers();

    // Rejoin mỗi khi SignalR (re)connect – xử lý trường hợp chưa connected khi component khởi tạo
    this.signalR.connectionState$
      .pipe(
        takeUntil(this.destroy$),
        filter(state => state === signalR.HubConnectionState.Connected)
      )
      .subscribe(() => {
        if (this.isLive) this.signalR.joinLogWatchers();
      });

    this.signalR.logEvent$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dto => {
        if (!this.isLive) return;
        this.zone.run(() => {
          this.allLogs.push(this.mapDtoToLog(dto));
          if (this.allLogs.length > MAX_LOGS)
            this.allLogs = this.allLogs.slice(this.allLogs.length - MAX_LOGS);
          this.applyFilter();
          this.scrollToBottomIfAuto();
        });
      });
  }

  applyFilter(): void {
    if (!this.selectedLevel) {
      this.filteredLogs = [...this.allLogs];
    } else {
      const lv = this.selectedLevel.toUpperCase();
      this.filteredLogs = this.allLogs.filter(l => {
        const cur = l.level.toUpperCase();
        if (lv === 'WARN')  return cur === 'WARN' || cur === 'WARNING';
        if (lv === 'INFO')  return cur === 'INFO' || cur === 'INFORMATION';
        return cur === lv;
      });
    }
  }

  onLevelChange(): void {
    this.applyFilter();
    this.scrollToBottomIfAuto();
  }

  clearLogs(): void {
    this.allLogs = [];
    this.filteredLogs = [];
  }

  toggleLive(): void {
    this.isLive = !this.isLive;
    this.isLive ? this.signalR.joinLogWatchers() : this.signalR.leaveLogWatchers();
  }

  refresh(): void {
    this.clearLogs();
    this.loadInitialLogs();
  }

  scrollToTop(): void {
    if (this.logContainer) this.logContainer.nativeElement.scrollTop = 0;
  }

  scrollToBottom(): void {
    if (this.logContainer) {
      const el = this.logContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  private scrollToBottomIfAuto(): void {
    if (!this.autoScroll) return;
    setTimeout(() => this.scrollToBottom(), 30);
  }

  toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) this.scrollToBottom();
  }

  toggleFullscreen(): void {
    const el = document.documentElement;
    if (!this.isFullscreen) {
      el.requestFullscreen?.() ?? (el as any).webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ?? (document as any).webkitExitFullscreen?.();
    }
  }

  private mapDtoToLog(dto: any): ParsedLog {
    return {
      timestamp:  dto.timestamp  ?? '',
      level:      dto.level      ?? 'INFO',
      logger:     dto.logger     ?? '',
      machine:    dto.machine    ?? '',
      processId:  dto.processId  ?? '',
      threadId:   dto.threadId   ?? '',
      message:    dto.message    ?? '',
      properties: dto.properties ?? '',
      rawLine:    `${dto.timestamp} | [${dto.level}] | ${dto.logger} | ${dto.message}`
    };
  }

  parseLog(line: string): ParsedLog {
    const parts = line.split(' | ');
    if (parts.length >= 6) {
      return {
        timestamp:  parts[0]?.trim() ?? '',
        level:      parts[1]?.replace(/[\[\]]/g, '').trim() ?? 'UNKNOWN',
        logger:     parts[2]?.trim() ?? '',
        machine:    parts[3]?.trim() ?? '',
        processId:  parts[4]?.replace('PID:', '').trim() ?? '',
        threadId:   parts[5]?.replace('TID:', '').trim() ?? '',
        message:    parts[6]?.trim() ?? '',
        properties: parts.length > 7 ? parts.slice(7).join(' | ').trim() : '',
        rawLine:    line
      };
    }
    return {
      timestamp: '', level: 'TXT', logger: '', machine: '',
      processId: '', threadId: '', message: line, properties: '', rawLine: line
    };
  }

  getLevelClass(level: string): string {
    switch (level.toUpperCase()) {
      case 'INFO': case 'INFORMATION': return 'INF';
      case 'ERROR':                    return 'ERR';
      case 'WARNING': case 'WARN':     return 'WRN';
      case 'DEBUG':                    return 'DBG';
      case 'TRACE':                    return 'TRC';
      case 'FATAL':                    return 'FAT';
      default:                         return 'TXT';
    }
  }

  trackLog(index: number): number { return index; }

  get logCount(): number  { return this.filteredLogs.length; }
  get totalCount(): number { return this.allLogs.length; }
}
