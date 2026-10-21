import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GlobalService } from '../services';
import { TokenService } from '../services/token.service';
import { LocalStorageUtils } from '../../shared/utils';
import { AccountService } from '../../features/system-manager/services/account.service';

@Injectable({
    providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanActivateChild {
    constructor(
        private router: Router,
        private globalService: GlobalService,
        private tokenService: TokenService,
        private accountService: AccountService,
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        return this.checkPermission(route, state.url);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        return this.checkPermission(childRoute, state.url);
    }

    private checkPermission(route: ActivatedRouteSnapshot, url: string): Observable<boolean> | boolean {
        const accountInfo = LocalStorageUtils.getItem('accountInfo');
        if (accountInfo?.isGuest) {
            const routePath = route.routeConfig?.path ?? '';
            const meetingId = route.paramMap.get('meetingId');
            const expectedMeetingPath = `/meeting/detail/${accountInfo.meetingId}`;
            const expectedWaitingPath = `/meeting/waiting/${accountInfo.meetingId}`;

            if (url?.startsWith(expectedMeetingPath)) {
                return true;
            }

            if (url?.startsWith(expectedWaitingPath)) {
                return true;
            }

            if (routePath === 'detail/:meetingId' && meetingId && meetingId === accountInfo.meetingId) {
                return true;
            }

            if (routePath === 'waiting/:meetingId' && meetingId && meetingId === accountInfo.meetingId) {
                return true;
            }

            this.router.navigate(['/login']);
            return false;
        }

        const requiredRight = route.data?.['requiredRight'] as string | string[] | undefined;
        if (!requiredRight) {
            return true;
        }

        if (this.globalService.hasAnyRight(requiredRight)) {
            return true;
        }

        if (!this.tokenService.hasValidAccessToken()) {
            // Đợi AuthGuard/TokenService lấy session. Nếu không được, AuthGuard sẽ văng ra login.
            return this.tokenService.ensureSession().pipe(
                switchMap(ok => {
                    if (!ok) return of(true); // Bỏ qua để AuthGuard xử lý việc redirect
                    return this.reloadRightsAndCheck(requiredRight);
                })
            );
        }

        return this.reloadRightsAndCheck(requiredRight);
    }

    /** Đồng bộ quyền từ server khi localStorage thiếu/lỗi thời (sau refresh token hoặc admin đổi quyền). */
    private reloadRightsAndCheck(requiredRight: string | string[]): Observable<boolean> {
        return this.accountService.myProfile().pipe(
            map((res: any) => {
                if (res?.status && res?.data) {
                    const rights = res.data.rights ?? res.data.Rights ?? [];
                    this.globalService.updateStoredAccountInfo({
                        ...res.data,
                        rights: Array.isArray(rights) ? rights : [],
                    });
                    if (this.globalService.hasAnyRight(requiredRight)) {
                        return true;
                    }
                }
                this.router.navigate(['/not-permission']);
                return false;
            }),
            catchError(() => {
                this.router.navigate(['/not-permission']);
                return of(false);
            }),
        );
    }
}

export default PermissionGuard;
