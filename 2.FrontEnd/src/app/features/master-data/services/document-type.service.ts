import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DocumentTypeDto } from '../models/document-type.model';

@Injectable({ providedIn: 'root' })
export class DocumentTypeService {
  constructor(private common: CommonService) { }

  search(params: DocumentTypeDto) { return this.common.get('DocumentType/Search', params); }
  insert(data: DocumentTypeDto) { return this.common.post('DocumentType/Insert', data); }
  update(data: DocumentTypeDto) { return this.common.put('DocumentType/Update', data); }
  detail(code: string) { return this.common.get(`DocumentType/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`DocumentType/Delete/${code}`, {}); }
}
