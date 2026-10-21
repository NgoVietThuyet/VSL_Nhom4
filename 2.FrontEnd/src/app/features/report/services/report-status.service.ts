import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportStatusDto } from '../models/report-status.model';

@Injectable({ providedIn: 'root' })
export class ReportStatusService {
    constructor(private common: CommonService) { }
    search(params: ReportStatusDto) { return this.common.get('Report/Status/Search', params); }
    getAll() { return this.common.get('Report/Status/GetAll', {}); }
    insert(data: ReportStatusDto) { return this.common.post('Report/Status/Insert', data); }
    update(data: ReportStatusDto) { return this.common.put('Report/Status/Update', data); }
    detail(code: string) { return this.common.get(`Report/Status/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/Status/Delete/${code}`, {}); }
}
