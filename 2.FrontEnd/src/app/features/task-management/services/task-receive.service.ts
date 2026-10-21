import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { TaskReceiveDto, UpdateProgressDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskReceiveService {
  constructor(private common: CommonService) { }

  search(params: TaskReceiveDto) { return this.common.get('TaskReceive/Search', params); }
  byTask(taskId: string) { return this.common.get(`TaskReceive/ByTask/${taskId}`, {}); }
  downstream(parentReceiveId: string) { return this.common.get(`TaskReceive/Downstream/${parentReceiveId}`, {}); }
  searchTaskList(params: TaskReceiveDto) { return this.common.get('TaskReceive/SearchTaskList', params); }
  detail(id: string) { return this.common.get(`TaskReceive/Detail/${id}`, {}); }
  accept(receiveId: string) { return this.common.put(`TaskReceive/Accept/${receiveId}`, {}, true, true); }
  startWorking(receiveId: string) { return this.common.put(`TaskReceive/StartWorking/${receiveId}`, {}, true, true); }
  updateProgress(dto: UpdateProgressDto) { return this.common.put('TaskReceive/UpdateProgress', dto); }
}
