import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { WfProcessDefinitionDto, WfProcessDesignDto } from '../models';

@Injectable({ providedIn: 'root' })
export class WfDefinitionService {
    constructor(private common: CommonService) { }
    search(params: WfProcessDefinitionDto) { return this.common.get('Workflow/Definition/Search', params); }
    getAll() { return this.common.get('Workflow/Definition/GetAll', {}); }
    getPublished() { return this.common.get('Workflow/Definition/GetPublished', {}); }
    detail(id: string) { return this.common.get(`Workflow/Definition/Detail/${id}`, {}); }
    design(id: string) { return this.common.get(`Workflow/Definition/Design/${id}`, {}); }
    insert(data: WfProcessDefinitionDto) { return this.common.post('Workflow/Definition/Insert', data); }
    update(data: WfProcessDefinitionDto) { return this.common.put('Workflow/Definition/Update', data); }
    saveDesign(data: WfProcessDesignDto) { return this.common.post('Workflow/Definition/SaveDesign', data); }
    clone(id: string, data: { newCode: string; newName: string }) { return this.common.post(`Workflow/Definition/Clone/${id}`, data); }
    publish(id: string, publish: boolean) { return this.common.post(`Workflow/Definition/Publish/${id}`, { publish }); }
    delete(id: string) { return this.common.delete(`Workflow/Definition/Delete/${id}`, {}); }
}
