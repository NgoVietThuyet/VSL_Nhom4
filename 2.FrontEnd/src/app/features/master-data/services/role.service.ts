import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { RoleDto } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private common: CommonService) { }

  search(params: RoleDto) { return this.common.get('Role/Search', params); }
  insert(data: RoleDto) { return this.common.post('Role/Insert', data); }
  update(data: RoleDto) { return this.common.put('Role/Update', data); }
  detail(code: string) { return this.common.get(`Role/Detail/${code}`, {}); }
  delete(code: string) { return this.common.delete(`Role/Delete/${code}`, {}); }
}
