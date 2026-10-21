import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { MenuDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class MenuService {
    constructor(private common: CommonService) { }

    search(params: MenuDto) { return this.common.get('Menu/Search', params) }

    insert(data: MenuDto) { return this.common.post('Menu/Insert', data) }

    update(data: MenuDto) { return this.common.put('Menu/Update', data) }

    detail(data: string) { return this.common.get(`Menu/Detail/${data}`, {}) }

    delete(data: string) { return this.common.delete(`Menu/Delete/${data}`, {}) }

    updateOrder(data: any) { return this.common.put(`Menu/UpdateOrder`, data) }
}
