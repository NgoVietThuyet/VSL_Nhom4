import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { CommonService } from '../../../shared/services'

@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  constructor(private commonService: CommonService) { }

  search(params: any): Observable<any> {
    return this.commonService.get('UserRole/Search', params)
  }

  getAll(): Observable<any> {
    return this.commonService.get('UserRole/GetAll')
  }

  create(params: any): Observable<any> {
    return this.commonService.post('UserRole/Insert', params)
  }

  update(params: any): Observable<any> {
    return this.commonService.put('UserRole/Update', params)
  }

  delete(id: string): Observable<any> {
    return this.commonService.delete(`UserRole/Delete/${id}`)
  }
  downloadTemplate(): Observable<any> {
    return this.commonService.downloadFile('UserRole/DownloadTemplate')
  }
  uploadTemplate(file: any): Observable<any> {
    return this.commonService.uploadFile('UserRole/UploadTemplate', file)
  }
  getUserRoleByOrganize(organizeId: string): Observable<any> {
    return this.commonService.get(`UserRole/GetUserRoleByOrganize/${organizeId}`);
  }
}
