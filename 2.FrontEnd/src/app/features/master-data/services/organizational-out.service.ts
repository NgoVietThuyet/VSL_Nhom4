import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';

@Injectable({
  providedIn: 'root',
})
export class OrganizationalOutService {
  constructor(private commonService: CommonService) {}

  search(params: any): Observable<any> {
    return this.commonService.get('OrganizationalNgoaiNganh/Search', params);
  }
  getLstOrganizeNgoaiNganhByUnitId(params: any): Observable<any> {
    return this.commonService.get(
      `OrganizationalNgoaiNganh/GetLstOrganizeNgoaiNganhByUnitId?unitId=${params}`
    );
  }
  create(params: any): Observable<any> {
    return this.commonService.post('OrganizationalNgoaiNganh/Insert', params);
  }
  createUnitOrg(params: any): Observable<any> {
    return this.commonService.post('OrganizationalNgoaiNganh/InsertUnitOrg', params);
  }
  update(params: any): Observable<any> {
    return this.commonService.put('OrganizationalNgoaiNganh/Update', params);
  }

  delete(id: string): Observable<any> {
    return this.commonService.delete(`OrganizationalNgoaiNganh/Delete/${id}`);
  }
  deleteMultipleUnitOrg(params: any): Observable<any> {
    return this.commonService.post(
      'OrganizationalNgoaiNganh/DeleteMultipleUnitOrg',
      params
    );
  }

  getAllOrgNgoaiNganh():Observable<any>{
    return this.commonService.get('OrganizationalNgoaiNganh/GetAll');
  }
}
