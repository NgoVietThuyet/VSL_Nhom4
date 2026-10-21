import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { CommonService } from '../../../shared/services';

@Injectable({
  providedIn: 'root',
})
export class OrganizeInService {
  constructor(private commonService: CommonService) {}

  GetOrgTree(param: any) {
    return this.commonService.get('Organize/GetOrganizeTree', param);
  }
  GetOrgTreeIn() {
    return this.commonService.get('Organize/GetOrganizeTreeInDemo');
  }

    GetOrgTreeNoiNganh() {
    return this.commonService.get('Organize/GetOrganizeInTree');
  }

    GetOrgTreeByCode(param: any) {
    return this.commonService.get('Organize/GetOrganizeTreeByOrgCode', param);
  }

  GetOrgTreeForUser(userName: string) {
    return this.commonService.get(`Organize/GetOrganizeInTreeForUser/${userName}`);
  }

  search(params: any): Observable<any> {
    return this.commonService.get('Organize/Search', params)
  }

  getDonViById(organizeId: string): Observable<any> {
    return this.commonService.get(`Organize/GetOrganize/${organizeId}`)
  }

  getOrg():Observable<any>{
    return this.commonService.get('Organize/GetAll');
  }

  Update(data: any) {
    return this.commonService.put('Organize/Update', data);
  }

  Insert(data: any) {
    return this.commonService.post('Organize/Insert', data);
  }

  UpdateOrderTree(dataTree: any) {
    return this.commonService.put('Organize/Update-Order', dataTree);
  }

  Delete(code: string | number): Observable<any> {
    return this.commonService.delete(`Organize/Delete/${code}`);
  }

    importExcel(formData: FormData): Observable<any> {
    return this.commonService.post('Organize/ImportOrganizeExcel', formData);
  }
}
