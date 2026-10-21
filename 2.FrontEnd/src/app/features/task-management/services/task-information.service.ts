import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { TaskInformationDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskInformationService {
  constructor(private common: CommonService) { }

  search(params: TaskInformationDto) { return this.common.get('TaskInformation/Search', params); }
  detail(id: string) { return this.common.get(`TaskInformation/Detail/${id}`, {}); }
  byDocument(documentId: string) { return this.common.get(`TaskInformation/ByDocument/${documentId}`, {}); }
  insert(data: TaskInformationDto) { return this.common.post('TaskInformation/Insert', data); }
  update(data: TaskInformationDto) { return this.common.put('TaskInformation/Update', data); }
  syncByDocument(documentId: string, tasks: TaskInformationDto[], notifySuccess = true) {
    return this.common.post(`TaskInformation/SyncByDocument/${documentId}`, tasks, true, notifySuccess);
  }
  delete(id: string) { return this.common.delete(`TaskInformation/Delete/${id}`, {}); }
  toggleStar(taskId: string) { return this.common.put(`TaskInformation/ToggleStar/${taskId}`, {}); }
  getTaskLog(taskId: string) { return this.common.get(`TaskInformation/GetTaskLog/${taskId}`, {}); }
  getDiscuss(taskId: string, type: number) {
    return this.common.get(`TaskInformation/GetDiscuss/${taskId}`, { type }, false);
  }
  insertDiscuss(payload: {
    taskId: string;
    discussType: number;
    content?: string;
    mentionIds?: string[];
    attachmentFileIds?: string[];
  }) {
    return this.common.post('TaskInformation/InsertDiscuss', payload, true, true);
  }
}
