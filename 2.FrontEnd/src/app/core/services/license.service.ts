import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CommonService } from '../../shared/services';

export interface LicenseInfo {
  id: string;
  customerName: string;
  companyName: string;
  domain: string;
  machineCode: string;
  issueDate: string;
  expiryDate: string;
  maxUsers: number;
  maxCameras: number;
  maxStorageGB: number;
  enabledModules: string[];
  version: string;
  signature?: string;
}

export interface LicenseStatus {
  isValid: boolean;
  code: string;
  message: string;
  info?: LicenseInfo | null;
  machineCode: string;
  daysRemaining?: number | null;
  expiryDate?: string | null;
}

export const LICENSE_INVALID_CODES = [
  'LICENSE_NOT_FOUND',
  'LICENSE_INVALID',
  'LICENSE_SIGNATURE_INVALID',
  'LICENSE_MACHINE_MISMATCH',
  'LICENSE_EXPIRED',
  'LICENSE_VERSION_INCOMPATIBLE'
];

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private statusSubject = new BehaviorSubject<LicenseStatus | null>(null);
  status$ = this.statusSubject.asObservable();

  constructor(private common: CommonService) {}

  get currentStatus(): LicenseStatus | null {
    return this.statusSubject.value;
  }

  setStatus(status: LicenseStatus | null) {
    this.statusSubject.next(status);
  }

  getStatus(showLoading = false): Observable<LicenseStatus> {
    return this.common.get<LicenseStatus>('License/Status', null, showLoading)
      .pipe(tap(status => this.statusSubject.next(status)));
  }

  getInfo(showLoading = false): Observable<LicenseInfo | null> {
    return this.common.get<LicenseInfo | null>('License/Info', null, showLoading);
  }

  getMachineCode(showLoading = false): Observable<{ machineCode: string }> {
    return this.common.get<{ machineCode: string }>('License/MachineCode', null, showLoading);
  }

  validateLicense(licenseContent: string, showLoading = true): Observable<any> {
    return this.common.post<any>('License/Validate', { licenseContent }, showLoading);
  }

  activateLicense(licenseContent: string, showLoading = true): Observable<any> {
    return this.common.post<any>('License/Activate', { licenseContent }, showLoading)
      .pipe(tap((res: any) => {
        const data = res?.data ?? res;
        if (data && typeof data === 'object' && 'isValid' in data) {
          this.statusSubject.next(data as LicenseStatus);
        }
      }));
  }
}
