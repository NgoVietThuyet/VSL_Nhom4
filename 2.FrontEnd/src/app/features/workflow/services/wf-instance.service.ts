import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { WfActionRequest, WfInstanceDto, WfSubmitRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class WfInstanceService {
    constructor(private common: CommonService) { }
    inbox(params: WfInstanceDto) { return this.common.get('Workflow/Instance/Inbox', params); }
    myRequests(params: WfInstanceDto) { return this.common.get('Workflow/Instance/MyRequests', params); }
    participated(params: WfInstanceDto) { return this.common.get('Workflow/Instance/Participated', params); }
    search(params: WfInstanceDto) { return this.common.get('Workflow/Instance/Search', params); }
    detail(id: string) { return this.common.get(`Workflow/Instance/Detail/${id}`, {}); }
    summary() { return this.common.get('Workflow/Instance/Summary', {}); }
    submit(data: WfSubmitRequest) { return this.common.post('Workflow/Instance/Submit', data); }
    approve(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Approve/${id}`, data); }
    reject(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Reject/${id}`, data); }
    return(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Return/${id}`, data); }
    cancel(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Cancel/${id}`, data); }
    delegate(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Delegate/${id}`, data); }
    resubmit(id: string, data: WfActionRequest) { return this.common.post(`Workflow/Instance/Resubmit/${id}`, data); }
}
