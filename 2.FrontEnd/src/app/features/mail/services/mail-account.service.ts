import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { MailAccountDto } from '../models/mail.models';

@Injectable({ providedIn: 'root' })
export class MailAccountService {
  constructor(private common: CommonService) {}

  /** Lấy URL OAuth đăng nhập Gmail */
  getGmailAuthUrl() {
    return this.common.get<string>('MailAccount/Gmail/Auth', {});
  }

  /** Lấy URL OAuth đăng nhập Microsoft */
  getMicrosoftAuthUrl() {
    return this.common.get<string>('MailAccount/Microsoft/Auth', {});
  }

  /** Lấy URL OAuth đăng nhập Zoho Mail */
  getZohoAuthUrl() {
    return this.common.get<string>('MailAccount/Zoho/Auth', {});
  }

  /** Lấy danh sách tài khoản mail đã liên kết */
  getAccounts(showLoading: boolean = true) {
    return this.common.get<MailAccountDto[]>('MailAccount/List', {}, showLoading);
  }

  /** Xóa liên kết tài khoản mail */
  deleteAccount(id: string) {
    return this.common.delete(`MailAccount/${id}`, {});
  }

  /** Đồng bộ thủ công theo provider (Gmail | Microsoft | Zoho) */
  syncNow(provider: string) {
    return this.common.post(`MailAccount/SyncNow/${provider}`, {});
  }

  /**
   * Kết nối tài khoản và kiểm tra trạng thái bằng cách so sánh số lượng tài khoản trước và sau
   */
  connectAccount(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.getAccounts(false).subscribe({
        next: (beforeRes: any) => {
          const beforeCount = (Array.isArray(beforeRes) ? beforeRes : beforeRes?.data || []).length;
          this.openOAuthPopup(url).then(() => {
            this.getAccounts(false).subscribe({
              next: (afterRes: any) => {
                const afterCount = (Array.isArray(afterRes) ? afterRes : afterRes?.data || []).length;
                resolve(afterCount > beforeCount);
              },
              error: () => resolve(false)
            });
          }).catch(() => resolve(false));
        },
        error: () => resolve(false)
      });
    });
  }

  /**
   * Mở cửa sổ popup OAuth và trả về Promise khi đăng nhập thành công
   */
  openOAuthPopup(url: string): Promise<{ provider: string }> {
    return new Promise((resolve, reject) => {
      const width  = 600;
      const height = 700;
      const left   = window.screenX + (window.outerWidth - width) / 2;
      const top    = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        reject(new Error('Không thể mở cửa sổ đăng nhập. Vui lòng tắt chặn popup.'));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success') {
          window.removeEventListener('message', messageHandler);
          resolve({ provider: event.data.provider });
        }
      };

      window.addEventListener('message', messageHandler);

      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          resolve({ provider: '' });
        }
      }, 500);
    });
  }
}
