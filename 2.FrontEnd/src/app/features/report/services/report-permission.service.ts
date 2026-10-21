import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportPermissionDto } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportPermissionService {
    constructor(private common: CommonService) { }
    byDefinition(definitionId: string) { return this.common.get(`Report/Permission/ByDefinition/${definitionId}`, {}); }
    insert(d: ReportPermissionDto) { return this.common.post('Report/Permission/Insert', d); }
    update(d: ReportPermissionDto) { return this.common.put('Report/Permission/Update', d); }
    delete(id: string) { return this.common.delete(`Report/Permission/Delete/${id}`, {}); }
}
