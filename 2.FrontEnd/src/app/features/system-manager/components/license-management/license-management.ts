import { Component, OnInit } from '@angular/core';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { LicenseService, LicenseStatus } from '../../../../core/services/license.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-license-management',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './license-management.html',
  styleUrl: './license-management.scss'
})
export class LicenseManagement implements OnInit {
  status: LicenseStatus | null = null;
  licenseContent = '';
  validateResult: { ok: boolean; code: string; message: string } | null = null;
  isWorking = false;

  constructor(
    private licenseService: LicenseService,
    private message: NzMessageService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.licenseService.getStatus(true).subscribe({
      next: status => this.status = status,
      error: () => { }
    });
  }

  copyMachineCode() {
    const code = this.status?.machineCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => this.message.success('Đã copy Machine Code'),
      () => this.message.error('Không thể copy')
    );
  }

  downloadInfo() {
    if (!this.status) return;
    const blob = new Blob([JSON.stringify(this.status, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-info-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  beforeUpload = (file: any): boolean => {
    const reader = new FileReader();
    reader.onload = () => {
      this.licenseContent = (reader.result as string) || '';
      this.message.info(`Đã đọc file ${file.name}`);
    };
    reader.readAsText(file);
    return false;
  };

  validate() {
    if (!this.licenseContent?.trim()) {
      this.message.warning('Vui lòng nhập hoặc tải file license');
      return;
    }
    this.isWorking = true;
    this.licenseService.validateLicense(this.licenseContent).subscribe({
      next: (res: any) => {
        this.isWorking = false;
        const data = res?.data ?? res;
        this.validateResult = {
          ok: !!data?.isValid,
          code: data?.code || res?.messageObject?.code || '',
          message: data?.message || res?.messageObject?.message || ''
        };
      },
      error: () => { this.isWorking = false; }
    });
  }

  activate() {
    if (!this.licenseContent?.trim()) {
      this.message.warning('Vui lòng nhập hoặc tải file license');
      return;
    }
    this.isWorking = true;
    this.licenseService.activateLicense(this.licenseContent).subscribe({
      next: (res: any) => {
        this.isWorking = false;
        const data = res?.data ?? res;
        if (data?.isValid) {
          this.notification.success('Kích hoạt thành công', 'License đã được cập nhật.');
          this.licenseContent = '';
          this.validateResult = null;
          this.refresh();
        } else {
          this.validateResult = {
            ok: false,
            code: data?.code || '',
            message: data?.message || res?.messageObject?.message || 'Kích hoạt thất bại'
          };
        }
      },
      error: () => { this.isWorking = false; }
    });
  }

  formatDate(d?: string | null) {
    if (!d) return '-';
    try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; }
  }

  get warnLevel(): 'success' | 'warning' | 'error' | 'info' {
    if (!this.status) return 'info';
    if (!this.status.isValid) return 'error';
    const dr = this.status.daysRemaining ?? 999;
    if (dr <= 7) return 'error';
    if (dr <= 30) return 'warning';
    return 'success';
  }
}
