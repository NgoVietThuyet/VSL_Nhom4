import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LocalStorageUtils } from '../../shared/utils';
import { TokenService } from '../services/token.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private tokenService: TokenService,
    ) { }

    canActivate(_route: unknown, state: RouterStateSnapshot): Observable<boolean> | boolean {
        if (this.tokenService.hasValidAccessToken()) {
            return true;
        }

        return this.tokenService.ensureSession().pipe(
            switchMap((ok) => {
                if (ok) {
                    return of(true);
                }
                LocalStorageUtils.clear();
                this.tokenService.clear();
                this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                return of(false);
            }),
        );
    }
}

export default AuthGuard;
