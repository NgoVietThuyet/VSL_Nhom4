import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {
  private readonly HEALTH_API = API_BASE + '/admin/system/health';
  private readonly CONFIG_API = API_BASE + '/admin/system/config';
  private readonly ADMINS_API = API_BASE + '/admin/system/admins';
  private readonly AUDIT_API = API_BASE + '/admin/system/audit-log';

  health: any = null;
  config: any = {};
  admins: any[] = [];
  auditLogs: any[] = [];
  saving = false;

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.fetchHealth();
    this.fetchConfig();
    this.fetchAdmins();
    this.fetchAuditLogs();
  }

  fetchHealth(): void {
    this.http.get<{ data: any }>(this.HEALTH_API).subscribe({
      next: (res) => this.health = res.data,
      error: () => this.message.error('Không kiểm tra được trạng thái máy chủ')
    });
  }

  fetchConfig(): void {
    this.http.get<{ data: any }>(this.CONFIG_API).subscribe({
      next: (res) => this.config = res.data || {}
    });
  }

  fetchAdmins(): void {
    this.http.get<{ data: any[] }>(this.ADMINS_API).subscribe({
      next: (res) => this.admins = res.data || []
    });
  }

  fetchAuditLogs(): void {
    this.http.get<{ data: any[] }>(this.AUDIT_API).subscribe({
      next: (res) => this.auditLogs = res.data || []
    });
  }

  saveConfig(): void {
    this.saving = true;
    this.http.put(this.CONFIG_API, this.config).subscribe({
      next: () => {
        this.saving = false;
        this.message.success('Cập nhật cấu hình hệ thống thành công');
      },
      error: () => {
        this.saving = false;
        this.message.error('Lỗi cập nhật cấu hình');
      }
    });
  }

  get jvmPercent(): number {
    if (!this.health?.jvmTotalMemoryMb) return 0;
    return Math.round((this.health.jvmUsedMemoryMb / this.health.jvmTotalMemoryMb) * 100);
  }

  initials(name?: string): string {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}
