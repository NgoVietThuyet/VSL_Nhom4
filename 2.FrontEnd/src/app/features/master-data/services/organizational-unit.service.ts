import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../../../shared/services';

@Injectable({
  providedIn: 'root',
})
export class OrganizationalUnitService {
  constructor(private commonService: CommonService) {}

  search(params: any): Observable<any> {
    return this.commonService.get('OrganizationalUnit/Search', params);
  }
  getByFilter(filter: any): Observable<any> {
    return this.commonService.get('OrganizationalUnit/GetByFilter', filter);
  }
  getAll(): Observable<any> {
    return this.commonService.get('OrganizationalUnit/GetAll');
  }
  getLstOrganizeChild(params: any): Observable<any> {
    return this.commonService.get(
      'OrganizationalUnit/GetLstOrganizeChild',
      params
    );
  }
    GetTreeOrganize(params: any): Observable<any> {
    return this.commonService.get(
      'OrganizationalUnit/GetTreeOrganize',
      params
    );
  }
  getLstOrganizeByUnitId(params: any): Observable<any> {
    return this.commonService.get(
      'OrganizationalUnit/GetLstOrganizeByUnitId',
      params
    );
  }
  create(params: any): Observable<any> {
    return this.commonService.post('OrganizationalUnit/Insert', params);
  }
  createUnitOrg(params: any): Observable<any> {
    return this.commonService.post('OrganizationalUnit/InsertUnitOrg', params);
  }
  update(params: any): Observable<any> {
    return this.commonService.put('OrganizationalUnit/Update', params);
  }

  delete(id: string): Observable<any> {
    return this.commonService.delete(`OrganizationalUnit/Delete/${id}`);
  }
  deleteMultipleUnitOrg(params: any): Observable<any> {
    return this.commonService.post(
      'OrganizationalUnit/DeleteMultipleUnitOrg',
      params
    );
  }
  downloadTemplate(): Observable<any> {
    return this.commonService.downloadFile(
      'OrganizationalUnit/DownloadTemplate'
    );
  }
  uploadTemplate(file: any): Observable<any> {
    return this.commonService.uploadFile(
      'OrganizationalUnit/UploadTemplate',
      file
    );
  }

  getAllKhoiDonViByOrgId(params: any): Observable<any> {
    return this.commonService.get(
      'OrganizationalUnit/GetAllKhoiDonViByOrgId',
      params
    );
  }
}
