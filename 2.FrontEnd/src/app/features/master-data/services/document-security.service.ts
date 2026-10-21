import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DocumentSecurityDto } from '../models/document-security.model';

@Injectable({ providedIn: 'root' })
export class DocumentSecurityService {
  constructor(private common: CommonService) { }

  search(params: DocumentSecurityDto) { return this.common.get('DocumentSecurity/Search', params); }
  insert(data: DocumentSecurityDto) { return this.common.post('DocumentSecurity/Insert', data); }
  update(data: DocumentSecurityDto) { return this.common.put('DocumentSecurity/Update', data); }
  detail(code: string) { return this.common.get(`DocumentSecurity/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`DocumentSecurity/Delete/${code}`, {}); }
}
