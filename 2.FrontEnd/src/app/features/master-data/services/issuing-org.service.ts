import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { IssuingOrgDto } from '../models/issuing-org.model';

@Injectable({
    providedIn: 'root',
})
export class IssuingOrgService {
    constructor(private common: CommonService) { }

    getAll() { return this.common.get('IssuingOrg/GetAll', {}, false); }

    search(params: IssuingOrgDto) { return this.common.get('IssuingOrg/Search', params) }

    insert(data: IssuingOrgDto) { return this.common.post('IssuingOrg/Insert', data) }

    update(data: IssuingOrgDto) { return this.common.put('IssuingOrg/Update', data) }

    detail(data: string) { return this.common.get(`IssuingOrg/Detail/${data}`, {}) }

    delete(data: string) { return this.common.delete(`IssuingOrg/Delete/${data}`, {}) }
}
