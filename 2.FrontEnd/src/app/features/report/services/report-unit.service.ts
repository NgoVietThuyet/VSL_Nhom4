import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportUnitDto } from '../models/report-unit.model';

@Injectable({ providedIn: 'root' })
export class ReportUnitService {
    constructor(private common: CommonService) { }
    search(params: ReportUnitDto) { return this.common.get('Report/Unit/Search', params); }
    getAll() { return this.common.get('Report/Unit/GetAll', {}); }
    insert(data: ReportUnitDto) { return this.common.post('Report/Unit/Insert', data); }
    update(data: ReportUnitDto) { return this.common.put('Report/Unit/Update', data); }
    detail(code: string) { return this.common.get(`Report/Unit/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/Unit/Delete/${code}`, {}); }
}
