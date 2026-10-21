import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { AccountGroupDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class AccountGroupService {
    constructor(private common: CommonService) { }

    search(params: AccountGroupDto) { return this.common.get('AccountGroup/Search', params) }

    insert(data: AccountGroupDto) { return this.common.post('AccountGroup/Insert', data) }

    update(data: AccountGroupDto) { return this.common.put('AccountGroup/Update', data) }

    detail(data: string) { return this.common.get(`AccountGroup/Detail/${data}`, {}) }
}
