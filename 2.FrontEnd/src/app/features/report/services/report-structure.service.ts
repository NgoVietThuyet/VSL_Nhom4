import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportStructureDto } from '../models/report-structure.model';

@Injectable({ providedIn: 'root' })
export class ReportStructureService {
    constructor(private common: CommonService) { }
    byDefinition(definitionId: string) { return this.common.get(`Report/Structure/ByDefinition/${definitionId}`, {}); }
    saveTree(definitionId: string, nodes: ReportStructureDto[]) { return this.common.post(`Report/Structure/SaveTree/${definitionId}`, nodes); }
    insert(data: ReportStructureDto) { return this.common.post('Report/Structure/Insert', data); }
    update(data: ReportStructureDto) { return this.common.put('Report/Structure/Update', data); }
    delete(id: string) { return this.common.delete(`Report/Structure/Delete/${id}`, {}); }

    upsert(data: ReportStructureDto) {
        return this.common.post('Report/Structure/Upsert', data);
    }

    getCellData(definitionId: string, code: string){
        return this.common.get<ReportStructureDto>(`Report/Structure/cell`,{ definitionId, code });
    }
}
