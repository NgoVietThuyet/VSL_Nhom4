import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LicenseService } from '../services/license.service';

@Injectable({ providedIn: 'root' })
export class LicenseGuard implements CanActivate {
  constructor(private licenseService: LicenseService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    let status = this.licenseService.currentStatus;
    if (!status) {
      try {
        status = await firstValueFrom(this.licenseService.getStatus());
      } catch {
        status = null;
      }
    }
    if (status && status.isValid) return true;
    this.router.navigate(['/license-expired']);
    return false;
  }
}

export default LicenseGuard;
