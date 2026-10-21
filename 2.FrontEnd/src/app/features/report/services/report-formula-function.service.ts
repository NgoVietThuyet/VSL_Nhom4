import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportFormulaFunctionDto } from '../models/report-formula-function.model';

@Injectable({ providedIn: 'root' })
export class ReportFormulaFunctionService {
    constructor(private common: CommonService) { }
    search(params: ReportFormulaFunctionDto) { return this.common.get('Report/FormulaFunction/Search', params); }
    getAll() { return this.common.get('Report/FormulaFunction/GetAll', {}); }
    insert(data: ReportFormulaFunctionDto) { return this.common.post('Report/FormulaFunction/Insert', data); }
    update(data: ReportFormulaFunctionDto) { return this.common.put('Report/FormulaFunction/Update', data); }
    detail(code: string) { return this.common.get(`Report/FormulaFunction/Detail/${code}`, {}); }
    delete(code: string) { return this.common.delete(`Report/FormulaFunction/Delete/${code}`, {}); }
}
