import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportDataTypeDto } from '../models/report-data-type.model';

@Injectable({ providedIn: 'root' })
export class ReportDataTypeService {
    constructor(private common: CommonService) { }
    search(params: ReportDataTypeDto) { return this.common.get('Report/DataType/Search', params); }
    getAll() { return this.common.get('Report/DataType/GetAll', {}); }
    insert(data: ReportDataTypeDto) { return this.common.post('Report/DataType/Insert', data); }
    update(data: ReportDataTypeDto) { return this.common.put('Report/DataType/Update', data); }
    detail(code: string) { return this.common.get(`Report/DataType/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/DataType/Delete/${code}`, {}); }
}
