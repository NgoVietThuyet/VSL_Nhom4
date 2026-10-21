import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportPeriodTypeDto } from '../models/report-period-type.model';

@Injectable({ providedIn: 'root' })
export class ReportPeriodTypeService {
    constructor(private common: CommonService) { }
    search(params: ReportPeriodTypeDto) { return this.common.get('Report/PeriodType/Search', params); }
    getAll() { return this.common.get('Report/PeriodType/GetAll', {}); }
    insert(data: ReportPeriodTypeDto) { return this.common.post('Report/PeriodType/Insert', data); }
    update(data: ReportPeriodTypeDto) { return this.common.put('Report/PeriodType/Update', data); }
    detail(code: string) { return this.common.get(`Report/PeriodType/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/PeriodType/Delete/${code}`, {}); }
}
