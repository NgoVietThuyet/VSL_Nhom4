import { Injectable } from '@angular/core';
import { OrganizeDto } from '../models/organize.model';
import { CommonService } from '../../../shared/services';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OrganizeService {
    constructor(private common: CommonService) { }

    // search(params: OrganizeDto) { return this.common.get('Organize/Search', params) }
    search(params: any): Observable<any> {
        return this.common.get('Organize/Search', params)
    }

    insert(data: OrganizeDto) { return this.common.post('Organize/Insert', data) }

    update(data: OrganizeDto) { return this.common.put('Organize/Update', data) }

    detail(data: string) { return this.common.get(`Organize/Detail/${data}`, {}) }

    delete(data: string) { return this.common.delete(`Organize/Delete/${data}`, {}) }

    updateOrder(data: any) { return this.common.put(`Organize/UpdateOrder`, data) }
    
    import(mode: any, data: any) { return this.common.post(`Organize/Import/${mode}`, data) }

    dowload() { return this.common.downloadFile('Organize/Dowload', null) }

}
