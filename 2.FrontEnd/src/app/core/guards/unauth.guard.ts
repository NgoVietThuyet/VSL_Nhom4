import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocalStorageUtils } from '../../shared/utils';
import { TokenService } from '../services/token.service';

@Injectable({
    providedIn: 'root'
})
export class UnauthGuard implements CanActivate {
    constructor(
        private router: Router,
        private tokenService: TokenService,
    ) { }

    canActivate(): Observable<boolean> | boolean {
        if (this.tokenService.hasValidAccessToken()) {
            this.router.navigate(['/']);
            return false;
        }

        return this.tokenService.ensureSession().pipe(
            map((ok) => {
                if (ok) {
                    this.router.navigate(['/']);
                    return false;
                }
                LocalStorageUtils.clear();
                this.tokenService.clear();
                return true;
            }),
        );
    }
}

export default UnauthGuard;
