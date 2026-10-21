import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({ providedIn: 'root' })
export class TaskProgressReportService {
  constructor(private common: CommonService) {}

  getByTask(taskId: string) {
    return this.common.get(`TaskProgressReport/GetByTask/${taskId}`, {});
  }

  add(data: { taskId: string; reportContent?: string; attachmentFileIds?: string[] }) {
    return this.common.post('TaskProgressReport/Add', data, true, true);
  }

  delete(id: string) {
    return this.common.delete(`TaskProgressReport/Delete/${id}`, {});
  }
}
