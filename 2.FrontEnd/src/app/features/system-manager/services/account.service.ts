import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';
import { EnvironmentService } from '../../../core';
import { AccountDto, AccountRightDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    constructor(
        private common: CommonService,
        private env: EnvironmentService,
    ) { }

    search(params: AccountDto) { return this.common.get('Account/Search', params, true) }

    insert(data: AccountDto) { return this.common.post('Account/Insert', data) }

    update(data: AccountDto) { return this.common.put('Account/Update', data) }

    updateMyProfile(data: AccountDto) { return this.common.put('Account/UpdateMyProfile', data) }
    
    updateAccountRight(data: AccountRightDto) { return this.common.put('Account/UpdateAccountRight', data) }

    detail(data: string) { return this.common.get(`Account/Detail/${data}`, {}) }

    myProfile() { return this.common.get('Account/MyProfile', {}) }

    uploadAvatar(userName: string, file: File) {
        return this.common.uploadFile(
            `Account/UploadAvatar/${encodeURIComponent(userName)}`,
            file,
            undefined,
            undefined,
            false,
        );
    }

    removeAvatar(userName: string) {
        return this.common.delete(`Account/Avatar/${encodeURIComponent(userName)}`, {}, false);
    }

    getAvatarUrl(userName?: string | null, avatarFileId?: string | null, cacheBust?: string | number): string | null {
        if (!userName || !avatarFileId) return null;
        const base = `${this.env.getEnv('baseUrl')}/Account/Avatar/${encodeURIComponent(userName)}`;
        return cacheBust != null ? `${base}?v=${cacheBust}` : base;
    }
    
    import(mode: any, data: any) { return this.common.post(`Account/Import/${mode}`, data) }

    dowload() { return this.common.downloadFile('Account/Dowload', null) }

    resetPassword(userName: string) { return this.common.put(`Account/ResetPassword/${userName}`, {}) }

    getAllByOrg(orgId?: string, titleCodes?: string[]): Observable<AccountDto[]> {
        const params: any = {};
        if (orgId) params['orgId'] = orgId;
        if (titleCodes?.length) params['titleCodes'] = titleCodes.join(',');
        return this.common.get<AccountDto[]>('Account/AllByOrg', params).pipe(
            map((r: any) => (Array.isArray(r) ? r : r?.data ?? []))
        );
    }

    listUsers(): Observable<AccountDto[]> {
        return this.search({ pageSize: 999, currentPage: 1 } as any).pipe(
            map((r: any) => r?.data?.data ?? r?.data ?? [])
        );
    }

    GetAllClerks(orgCode: string): Observable<any> {
        return this.common.get('Account/GetAllClerks', { orgCode });
    }
}
