import { HttpClient, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { EnvironmentService } from '../../../core'
import { CommonService } from '../../../shared/services'

@Injectable({
  providedIn: 'root',
})
export class DocumentBookService {
  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private env : EnvironmentService,
    ) { }

  search(params: any): Observable<any> {
    return this.commonService.get('DocumentBook/Search', params)
  }

  getAll(): Observable<any> {
    return this.commonService.get('DocumentBook/GetAll')
  }

  checkHasDocument(id: string): Observable<any> {
    return this.commonService.get(`DocumentBook/CheckHasDocument?bookId=${id}`)
  }

  create(params: any): Observable<any> {
    return this.commonService.post('DocumentBook/AddDocumentBook', params)
  }

  update(params: any): Observable<any> {
    return this.commonService.put('DocumentBook/UpdateDocumentBook', params)
  }

  delete(id: string): Observable<any> {
    return this.commonService.delete(`DocumentBook/Delete/${id}`)
  }

  GetAllVanBanTheoSo(params: any): Observable<any> {
    return this.commonService.post('DocumentBook/GetAllVanBanTheoSo', params)
  }

  GetAllVanBanTheoSoIds(filter: any): Observable<any> {
    return this.commonService.post('DocumentBook/GetAllVanBanTheoSoIds', filter)
  }

  UpdateDocumentBookStatus(params: any): Observable<any> {
    return this.commonService.put('DocumentBook/UpdateDocumentBookStatus', params)
  }

  //exportExcel(formData: FormData): Observable<Blob> {
  //  return this.commonService.post('DocumentBook/export-vb-to-excel', formData)
  //}

  exportExcel(bookId: string, lstDocumentId: string): Observable<HttpResponse<Blob>> {
    const formData = new FormData();
    formData.append('BookId', bookId);
    formData.append('lstDocumentId', lstDocumentId);

    return this.http.post(`${this.env.getEnv('apiUrl')}/DocumentBook/export-vb-to-excel`, formData, {
      responseType: 'blob',
      observe: 'response'
    });
  }
  downloadTemplate(): Observable<any> {
    return this.commonService.downloadFile('DocumentBook/DownloadTemplate')
  }
  uploadTemplate(file: any): Observable<any> {
    return this.commonService.uploadFile('DocumentBook/UploadTemplate', file)
  }


}
