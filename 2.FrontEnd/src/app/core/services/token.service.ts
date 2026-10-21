import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';
import { GlobalService } from './global.service';
import { JwtUtils } from '../../shared/utils';

/**
 * Access token chỉ lưu trong memory (không localStorage).
 * Refresh token do backend đặt trong HttpOnly cookie — trình duyệt tự gửi khi gọi /Auth/RefreshToken.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken: string | null = null;
  private refreshInFlight: Observable<boolean> | null = null;

  constructor(
    private http: HttpClient,
    private env: EnvironmentService,
    private global: GlobalService,
  ) {
    this.removeLegacyTokenStorage();
    this.syncBrowserBridge();
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token?.trim() || null;
    this.removeLegacyTokenStorage();
    this.syncBrowserBridge();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasValidAccessToken(): boolean {
    return JwtUtils.isUsable(this.accessToken);
  }

  clear(): void {
    this.accessToken = null;
    this.refreshInFlight = null;
    this.removeLegacyTokenStorage();
    this.removeBrowserBridge();
  }

  /** Khôi phục phiên sau F5: cookie refresh → access token + cập nhật quyền trong accountInfo. */
  refreshSession(): Observable<boolean> {
    if (this.hasValidAccessToken()) {
      return of(true);
    }

    if (!this.refreshInFlight) {
      const url = `${this.env.getEnv('baseUrl')}/Auth/RefreshToken`;
      this.refreshInFlight = this.http.post<any>(url, {}, { withCredentials: true }).pipe(
        map((res) => {
          if (res?.status && JwtUtils.isUsable(res?.data?.accessToken)) {
            this.setAccessToken(res.data.accessToken);
            this.applyAccountInfoFromAuth(res.data?.accountInfo);
            return true;
          }
          this.clear();
          return false;
        }),
        catchError(() => {
          this.clear();
          return of(false);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
      );
    }

    return this.refreshInFlight;
  }

  ensureSession(): Observable<boolean> {
    return this.refreshSession();
  }

  logout(): Observable<void> {
    const url = `${this.env.getEnv('baseUrl')}/Auth/Logout`;
    return this.http
      .post(url, {}, { withCredentials: true })
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      );
  }

  private applyAccountInfoFromAuth(accountInfo: Record<string, unknown> | null | undefined): void {
    if (!accountInfo || typeof accountInfo !== 'object') {
      return;
    }

    const rights = (accountInfo['rights'] ?? accountInfo['Rights']) as string[] | undefined;
    this.global.updateStoredAccountInfo({
      ...accountInfo,
      rights: Array.isArray(rights) ? rights : undefined,
    });
  }

  private removeLegacyTokenStorage(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Cho PDF viewer cùng origin (Authorization header, không đưa token vào URL).
   * Xóa khi clear/logout để giảm cửa sổ đọc token sau XSS.
   */
  private syncBrowserBridge(): void {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { getXwAccessToken?: () => string };
    if (!w.getXwAccessToken) {
      Object.defineProperty(w, 'getXwAccessToken', {
        value: () => this.getAccessToken() || '',
        writable: false,
        configurable: true,
      });
    }
  }

  private removeBrowserBridge(): void {
    if (typeof window === 'undefined') return;
    const w = window as unknown as { getXwAccessToken?: () => string };
    if (Object.getOwnPropertyDescriptor(w, 'getXwAccessToken')?.configurable) {
      delete w.getXwAccessToken;
    }
  }
}
