import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { ReportDto, ReportDataDto } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
    constructor(private common: CommonService) { }
    search(p: ReportDto) { return this.common.get('Report/Report/Search', p); }
    detail(id: string) { return this.common.get(`Report/Report/Detail/${id}`, {}); }
    entry(id: string) { return this.common.get(`Report/Report/Entry/${id}`, {}); }
    create(d: ReportDto) { return this.common.post('Report/Report/Create', d); }
    update(d: ReportDto) { return this.common.put('Report/Report/Update', d); }
    saveData(id: string, data: ReportDataDto[]) { return this.common.post(`Report/Report/SaveData/${id}`, data, false)}
    importData(id: string, formData: FormData) { return this.common.post(`Report/Report/ImportData/${id}`, formData, true); }
    cellHistory(id: string, cellCode?: string) { return this.common.get(`Report/Report/CellHistory/${id}`, cellCode ? { cellCode } : {}); }
    getCellComments(id: string, cellCode?: string) { return this.common.get(`Report/Report/CellComments/${id}`, cellCode ? { cellCode } : {}); }
    addCellComment(dto: any) { return this.common.post('Report/Report/CellComments', dto); }
    deleteCellComment(id: string) { return this.common.delete(`Report/Report/CellComments/${id}`, {}); }
    submit(id: string, comment?: string, assignedTo?: string) { return this.common.post(`Report/Report/Submit/${id}`, { comment, assignedTo }); }
    getCommuneTree() { return this.common.get('Report/Report/GetCommuneTree', {}); }
    approve(id: string, comment?: string) { return this.common.post(`Report/Report/Approve/${id}`, { comment }); }
    return(id: string, comment?: string) { return this.common.post(`Report/Report/Return/${id}`, { comment }); }
    reject(id: string, comment?: string) { return this.common.post(`Report/Report/Reject/${id}`, { comment }); }
    lock(id: string, comment?: string) { return this.common.post(`Report/Report/Lock/${id}`, { comment }); }
    editAgree(id: string) { return this.common.post(`Report/Report/EditAgree/${id}`, {}); }
    aggregate(id: string) { return this.common.post(`Report/Report/Aggregate/${id}`, {}); }
    history(id: string) { return this.common.get(`Report/Report/History/${id}`, {}); }
    delete(id: string) { return this.common.delete(`Report/Report/Delete/${id}`, {}); }
    exportExcel(id: string) { return this.common.downloadFile(`Report/Report/Export/${id}`); }
}
