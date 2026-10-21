import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportDefinitionDto } from '../models/report-definition.model';

@Injectable({ providedIn: 'root' })
export class ReportDefinitionService {
    constructor(private common: CommonService) { }
    search(params: ReportDefinitionDto) { return this.common.get('Report/Definition/Search', params); }
    getAll() { return this.common.get('Report/Definition/GetAll', {}); }
    insert(data: ReportDefinitionDto) { return this.common.post('Report/Definition/Insert', data); }
    update(data: ReportDefinitionDto) { return this.common.put('Report/Definition/Update', data); }
    detail(id: string) { return this.common.get(`Report/Definition/Detail/${id}`, {}); }
    delete(id: string) { return this.common.delete(`Report/Definition/Delete/${id}`, {}); }
}
