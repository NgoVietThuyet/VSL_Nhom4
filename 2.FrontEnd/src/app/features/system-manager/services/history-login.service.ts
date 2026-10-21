import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { HistoryLoginDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class HistoryLoginService {
    constructor(private common: CommonService) { }

    search(params: HistoryLoginDto) { return this.common.get('HistoryLogin/Search', params) }

    insert(data: HistoryLoginDto) { return this.common.post('HistoryLogin/Insert', data) }

    update(data: HistoryLoginDto) { return this.common.put('HistoryLogin/Update', data) }

    detail(data: string) { return this.common.get(`HistoryLogin/Detail/${data}`, {}) }

    delete(data: any) { return this.common.post('HistoryLogin/Delete', data) }

}
