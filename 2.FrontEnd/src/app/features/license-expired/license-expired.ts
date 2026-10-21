import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModules } from '../../shared/ng-zorro.module';
import { LicenseService, LicenseStatus } from '../../core/services/license.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { LocalStorageUtils } from '../../shared/utils';

@Component({
  selector: 'app-license-expired',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './license-expired.html',
  styleUrl: './license-expired.scss'
})
export class LicenseExpired implements OnInit {
  status: LicenseStatus | null = null;
  machineCode = '';
  licenseContent = '';
  isWorking = false;
  validateResult: { ok: boolean; code: string; message: string } | null = null;

  constructor(
    private licenseService: LicenseService,
    private router: Router,
    private message: NzMessageService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    LocalStorageUtils.clear();
    this.refresh();
  }

  refresh() {
    this.licenseService.getStatus(true).subscribe({
      next: status => {
        this.status = status;
        this.machineCode = status?.machineCode || '';
        if (status?.isValid) {
          this.router.navigate(['/login']);
        }
      },
      error: () => { }
    });

    if (!this.machineCode) {
      this.licenseService.getMachineCode().subscribe({
        next: r => this.machineCode = r?.machineCode || '',
        error: () => { }
      });
    }
  }

  copyMachineCode() {
    if (!this.machineCode) return;
    navigator.clipboard.writeText(this.machineCode).then(
      () => this.message.success('Đã copy Machine Code'),
      () => this.message.error('Không thể copy')
    );
  }

  onFileSelected(event: any) {
    const file: File = event?.target?.files?.[0] || event?.file?.originFileObj || event?.file;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.licenseContent = (reader.result as string) || '';
    };
    reader.readAsText(file);
    return false;
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
        if (this.validateResult.ok) {
          this.notification.success('License hợp lệ', 'Bạn có thể nhấn Activate để kích hoạt.');
        }
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
          this.notification.success('Kích hoạt thành công', 'Hệ thống đã được kích hoạt license mới.');
          setTimeout(() => this.router.navigate(['/login']), 800);
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
}
