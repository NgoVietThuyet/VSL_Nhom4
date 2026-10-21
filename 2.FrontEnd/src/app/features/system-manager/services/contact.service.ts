import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ContactDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ContactService {
    constructor(private common: CommonService) { }

    search(params: ContactDto) { 
        return this.common.get('Contact/Search', params, true) 
    }

    insert(data: ContactDto) { 
        return this.common.post('Contact/Insert', data) 
    }

    update(data: ContactDto) { 
        return this.common.put('Contact/Update', data) 
    }

    detail(id: string) { 
        return this.common.get(`Contact/Detail/${id}`, {}) 
    }

    delete(id: string) { 
        return this.common.delete(`Contact/Delete/${id}`, {}) 
    }

    getGoogleAuthUrl() {
        return this.common.get('Contact/Google/Auth', {}, true);
    }

    getGoogleAccount() {
        return this.common.get('Contact/Google/Account', {}, true);
    }

    disconnectGoogle() {
        return this.common.post('Contact/Google/Disconnect', {});
    }

    syncGoogleNow() {
        return this.common.post('Contact/Google/SyncNow', {});
    }
}
