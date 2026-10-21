import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportFormulaDto } from '../models/report-formula.model';

@Injectable({ providedIn: 'root' })
export class ReportFormulaService {
    constructor(private common: CommonService) { }
    byDefinition(definitionId: string) { return this.common.get(`Report/Formula/ByDefinition/${definitionId}`, {}); }
    insert(data: ReportFormulaDto) { return this.common.post('Report/Formula/Insert', data); }
    update(data: ReportFormulaDto) { return this.common.put('Report/Formula/Update', data); }
    detail(id: string) { return this.common.get(`Report/Formula/Detail/${id}`, {}); }
    delete(id: string) { return this.common.delete(`Report/Formula/Delete/${id}`, {}); }
}
