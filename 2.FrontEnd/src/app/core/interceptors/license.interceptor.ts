import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LICENSE_INVALID_CODES, LicenseService } from '../services/license.service';
import { LocalStorageUtils } from '../../shared/utils';

export const LicenseInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const licenseService = inject(LicenseService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err?.status === 403) {
        const code = err?.error?.messageObject?.code || err?.error?.data?.code;
        if (code && LICENSE_INVALID_CODES.includes(code)) {
          handleLicenseExpired(router, licenseService, err?.error?.data);
        }
      }
      return throwError(() => err);
    })
  );
};

function handleLicenseExpired(router: Router, licenseService: LicenseService, data: any) {
  try {
    LocalStorageUtils.clear();
  } catch { }

  if (data) {
    licenseService.setStatus({
      isValid: false,
      code: data.code || 'LICENSE_INVALID',
      message: data.message || 'License không hợp lệ',
      machineCode: data.machineCode || '',
      daysRemaining: data.daysRemaining ?? null,
      expiryDate: data.expiryDate ?? null,
      info: null
    });
  }

  if (!router.url.startsWith('/license-expired')) {
    router.navigate(['/license-expired']);
  }
}
