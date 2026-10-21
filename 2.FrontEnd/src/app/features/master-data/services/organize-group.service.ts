import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { OrganizeGroupDto } from '../models/organize-group.model';

@Injectable({ providedIn: 'root' })
export class OrganizeGroupService {
  constructor(private common: CommonService) { }

  search(params: OrganizeGroupDto) { return this.common.get('OrganizeGroup/Search', params); }
  insert(data: OrganizeGroupDto) { return this.common.post('OrganizeGroup/Insert', data); }
  update(data: OrganizeGroupDto) { return this.common.put('OrganizeGroup/Update', data); }
  detail(code: string) { return this.common.get(`OrganizeGroup/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`OrganizeGroup/Delete/${code}`, {}); }
}
