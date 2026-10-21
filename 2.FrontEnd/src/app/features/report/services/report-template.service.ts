import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({ providedIn: 'root' })
export class ReportTemplateService {
    constructor(private common: CommonService) { }
    byDefinition(definitionId: string) { return this.common.get(`Report/Template/ByDefinition/${definitionId}`, {}); }
    upload(formData: FormData) { return this.common.post('Report/Template/Upload', formData); }
    download(id: string) { return `Report/Template/Download/${id}`; }
    delete(id: string) { return this.common.delete(`Report/Template/Delete/${id}`, {}); }
}
