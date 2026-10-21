import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { WfProcessCategoryDto } from '../models';

@Injectable({ providedIn: 'root' })
export class WfCategoryService {
    constructor(private common: CommonService) { }
    search(params: WfProcessCategoryDto) { return this.common.get('Workflow/Category/Search', params); }
    getAll() { return this.common.get('Workflow/Category/GetAll', {}); }
    detail(code: string) { return this.common.get(`Workflow/Category/Detail/${code}`, {}); }
    insert(data: WfProcessCategoryDto) { return this.common.post('Workflow/Category/Insert', data); }
    update(data: WfProcessCategoryDto) { return this.common.put('Workflow/Category/Update', data); }
    delete(code: string) { return this.common.delete(`Workflow/Category/Delete/${code}`, {}); }
}
