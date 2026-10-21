import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DispatchRequestDto, GiaoTiepRequestDto, TaskDispatchDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskDispatchService {
  constructor(private common: CommonService) { }

  search(params: TaskDispatchDto) { return this.common.get('TaskDispatch/Search', params); }
  detail(id: string) { return this.common.get(`TaskDispatch/Detail/${id}`, {}); }
  dispatch(data: DispatchRequestDto) { return this.common.post('TaskDispatch/Dispatch', data, true, false); }
  giaoTiep(data: GiaoTiepRequestDto) { return this.common.post('TaskDispatch/GiaoTiep', data); }
  redispatch(data: DispatchRequestDto) { return this.common.post('TaskDispatch/Redispatch', data); }
  cancel(dispatchId: string) { return this.common.put(`TaskDispatch/Cancel/${dispatchId}`, {}); }
  recall(dispatchId: string) { return this.common.put(`TaskDispatch/Recall/${dispatchId}`, {}); }
}
