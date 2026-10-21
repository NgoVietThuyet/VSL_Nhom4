import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({ providedIn: 'root' })
export class TaskTrackingService {
  constructor(private common: CommonService) { }

  taskTree(taskId: string) { return this.common.get(`TaskTracking/TaskTree/${taskId}`, {}); }
  dispatchTree(dispatchId: string) { return this.common.get(`TaskTracking/DispatchTree/${dispatchId}`, {}); }
  receiveTree(receiveId: string) { return this.common.get(`TaskTracking/ReceiveTree/${receiveId}`, {}); }
  traceToRootDocument(taskId: string) { return this.common.get(`TaskTracking/TraceToRootDocument/${taskId}`, {}); }
  traceToRootTask(receiveId: string) { return this.common.get(`TaskTracking/TraceToRootTask/${receiveId}`, {}); }
}
