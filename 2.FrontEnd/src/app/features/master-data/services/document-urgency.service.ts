import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DocumentUrgencyDto } from '../models/document-urgency.model';

@Injectable({ providedIn: 'root' })
export class DocumentUrgencyService {
  constructor(private common: CommonService) { }

  search(params: DocumentUrgencyDto) { return this.common.get('DocumentUrgency/Search', params); }
  insert(data: DocumentUrgencyDto) { return this.common.post('DocumentUrgency/Insert', data); }
  update(data: DocumentUrgencyDto) { return this.common.put('DocumentUrgency/Update', data); }
  detail(code: string) { return this.common.get(`DocumentUrgency/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`DocumentUrgency/Delete/${code}`, {}); }
}
