import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { CommonService } from '../../../shared/services';

@Injectable({
  providedIn: 'root',
})
export class ModuleTypeService {
  constructor(private commonService: CommonService) { }

  search(params: any): Observable<any> {
    return this.commonService.get('ModuleType/Search', params)
  }

  getAll(): Observable<any> {
    return this.commonService.get('ModuleType/GetAll')
  }

  create(params: any): Observable<any> {
    return this.commonService.post('ModuleType/Insert', params)
  }

  update(params: any): Observable<any> {
    return this.commonService.put('ModuleType/Update', params)
  }

  delete(id: string): Observable<any> {
    return this.commonService.delete(`ModuleType/Delete/${id}`)
  }
  downloadTemplate(): Observable<any> {
    return this.commonService.downloadFile('ModuleType/DownloadTemplate')
  }
  uploadTemplate(file: any): Observable<any> {
    return this.commonService.uploadFile('ModuleType/UploadTemplate', file)
  }
}
