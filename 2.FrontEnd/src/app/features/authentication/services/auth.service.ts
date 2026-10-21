import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private common: CommonService) { }

    loginAccount(data: any) { return this.common.post('Auth/Login', data) }
    loginMobileAccount(data: any) { return this.common.post('Auth/LoginMobile', data) }
    loginGuest(data: any) { return this.common.post('Auth/LoginGuest', data) }
    requestOtp(email: string) { return this.common.post('Auth/RequestOtp', { email }) }
    resetPasswordWithOtp(data: any) { return this.common.post('Auth/ResetPasswordWithOtp', data) }
    verifyLoginOtp(challengeId: string, otpCode: string) { return this.common.post('Auth/VerifyLoginOtp', { challengeId, otpCode }) }
}
