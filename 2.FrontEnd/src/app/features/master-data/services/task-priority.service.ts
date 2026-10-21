import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { TaskPriorityDto } from '../models/task-priority.model';

@Injectable({ providedIn: 'root' })
export class TaskPriorityService {
  constructor(private common: CommonService) { }

  search(params: TaskPriorityDto) { return this.common.get('TaskPriority/Search', params); }
  insert(data: TaskPriorityDto) { return this.common.post('TaskPriority/Insert', data); }
  update(data: TaskPriorityDto) { return this.common.put('TaskPriority/Update', data); }
  detail(code: string) { return this.common.get(`TaskPriority/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`TaskPriority/Delete/${code}`, {}); }
}
