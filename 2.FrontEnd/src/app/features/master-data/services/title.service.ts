import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { TitleDto } from '../models/title.model';

@Injectable({
    providedIn: 'root',
})
export class TitleService {
    constructor(private common: CommonService) { }

    search(params: TitleDto) { return this.common.get('Title/Search', params) }

    insert(data: TitleDto) { return this.common.post('Title/Insert', data) }

    update(data: TitleDto) { return this.common.put('Title/Update', data) }

    detail(data: string) { return this.common.get(`Title/Detail/${data}`, {}) }

    delete(data: string) { return this.common.delete(`Title/Delete/${data}`, {}) }

    updateOrder(data: any) { return this.common.put(`Title/UpdateOrder`, data) }

    import(mode: any, data: any) { return this.common.post(`Title/Import/${mode}`, data) }

    dowload() { return this.common.downloadFile('Title/Dowload', null) }

}
