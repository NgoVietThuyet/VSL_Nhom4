import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';

@Injectable({
    providedIn: 'root',
})
export class MainLayoutService {
    constructor(private common: CommonService) { }
     
    getMenuByUser(param: string) { return this.common.get(`Menu/GetMenuByUser/${param}`) }

    getCountAll() {
        return this.common.get('Count/All', {}, false);
    }

    changePassword(param: any): Observable<any> { 
        return this.common.post(`Account/ChangePassword`, param) 
    }

}
