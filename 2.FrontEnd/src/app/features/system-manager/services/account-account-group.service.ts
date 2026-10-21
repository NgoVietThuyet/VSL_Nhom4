import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { AccountAccountGroupDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class AccountAccountGroupService {
    constructor(private common: CommonService) { }
    insert(data: AccountAccountGroupDto) { return this.common.post('AccountAccountGroup/Insert', data) }

    delete(data: AccountAccountGroupDto) { return this.common.post('AccountAccountGroup/Delete', data) }
}
