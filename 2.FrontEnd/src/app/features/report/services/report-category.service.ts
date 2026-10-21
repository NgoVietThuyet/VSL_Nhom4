import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportCategoryDto } from '../models/report-category.model';

@Injectable({ providedIn: 'root' })
export class ReportCategoryService {
    constructor(private common: CommonService) { }
    search(params: ReportCategoryDto) { return this.common.get('Report/Category/Search', params); }
    getAll() { return this.common.get('Report/Category/GetAll', {}); }
    insert(data: ReportCategoryDto) { return this.common.post('Report/Category/Insert', data); }
    update(data: ReportCategoryDto) { return this.common.put('Report/Category/Update', data); }
    detail(code: string) { return this.common.get(`Report/Category/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/Category/Delete/${code}`, {}); }
}
