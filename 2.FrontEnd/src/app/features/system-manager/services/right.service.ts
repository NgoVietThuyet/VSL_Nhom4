import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { RightDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class RightService {
    constructor(private common: CommonService) { }

    search(params: RightDto) { return this.common.get('Right/Search', params) }

    insert(data: RightDto) { return this.common.post('Right/Insert', data) }

    update(data: RightDto) { return this.common.put('Right/Update', data) }

    detail(data: string) { return this.common.get(`Right/Detail/${data}`, {}) }

    delete(data: string) { return this.common.delete(`Right/Delete/${data}`, {}) }

    updateOrder(data: any) { return this.common.put(`Right/UpdateOrder`, data) }
}
