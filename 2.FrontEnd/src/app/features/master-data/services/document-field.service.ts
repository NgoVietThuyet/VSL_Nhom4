import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DocumentFieldDto } from '../models/document-field.model';

@Injectable({ providedIn: 'root' })
export class DocumentFieldService {
  constructor(private common: CommonService) { }

  search(params: DocumentFieldDto) { return this.common.get('DocumentField/Search', params); }
  insert(data: DocumentFieldDto) { return this.common.post('DocumentField/Insert', data); }
  update(data: DocumentFieldDto) { return this.common.put('DocumentField/Update', data); }
  detail(code: string) { return this.common.get(`DocumentField/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`DocumentField/Delete/${code}`, {}); }
}
