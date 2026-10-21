import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportPeriodDto } from '../models/report-period.model';

@Injectable({ providedIn: 'root' })
export class ReportPeriodService {
    constructor(private common: CommonService) { }
    search(params: ReportPeriodDto) { return this.common.get('Report/Period/Search', params); }
    getAll() { return this.common.get('Report/Period/GetAll', {}); }
    insert(data: ReportPeriodDto) { return this.common.post('Report/Period/Insert', data); }
    update(data: ReportPeriodDto) { return this.common.put('Report/Period/Update', data); }
    detail(code: string) { return this.common.get(`Report/Period/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/Period/Delete/${code}`, {}); }
}
