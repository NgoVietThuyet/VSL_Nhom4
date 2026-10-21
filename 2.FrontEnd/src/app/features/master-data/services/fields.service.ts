import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { FieldsDto } from '../models/fields.model';

@Injectable({ providedIn: 'root' })
export class FieldsService {
  constructor(private common: CommonService) { }

  search(params: FieldsDto) { return this.common.get('Fields/Search', params); }
  insert(data: FieldsDto) { return this.common.post('Fields/Insert', data); }
  update(data: FieldsDto) { return this.common.put('Fields/Update', data); }
  detail(code: any) { return this.common.get(`Fields/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`Fields/Delete/${code}`, {}); }
}
