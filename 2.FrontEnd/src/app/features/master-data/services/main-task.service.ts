import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { MainTaskDto } from '../models/main-task.model';

@Injectable({ providedIn: 'root' })
export class MainTaskService {
  constructor(private common: CommonService) {}

  search(params: MainTaskDto) { return this.common.get('MainTask/Search', params); }
  getAll() { return this.common.get('MainTask/GetAll', {}); }
  insert(data: MainTaskDto) { return this.common.post('MainTask/Insert', data); }
  update(data: MainTaskDto) { return this.common.put('MainTask/Update', data); }
  detail(id: string) { return this.common.get(`MainTask/Detail/${id}`, {}); }
  delete(id: string) { return this.common.delete(`MainTask/Delete/${id}`, {}); }
  createSubMainTask(parentId: string, data: MainTaskDto) {
    return this.common.post(`MainTask/CreateSubMainTask/${parentId}`, data);
  }
  getMainTaskTree(parentId?: string) {
    return this.common.get('MainTask/GetMainTaskTree', parentId ? { parentId } : {});
  }
  updateStatus(id: string, status: number) {
    return this.common.post('MainTask/UpdateStatus', { id, status });
  }
  updateProgress(id: string, progress: number) {
    return this.common.post('MainTask/UpdateProgress', { id, progress });
  }
}
