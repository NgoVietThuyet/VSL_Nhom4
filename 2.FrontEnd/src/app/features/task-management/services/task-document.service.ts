import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { TaskDocumentDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskDocumentService {
  constructor(private common: CommonService) { }

  search(params: TaskDocumentDto) { return this.common.get('TaskDocument/Search', params); }
  detail(id: string) { return this.common.get(`TaskDocument/Detail/${id}`, {}); }
  insert(data: TaskDocumentDto, notifySuccess = true) {
    return this.common.post('TaskDocument/Insert', data, true, notifySuccess);
  }
  update(data: TaskDocumentDto, notifySuccess = true) {
    return this.common.put('TaskDocument/Update', data, true, notifySuccess);
  }
  delete(id: string) { return this.common.delete(`TaskDocument/Delete/${id}`, {}); }
  updateStatus(id: string, status: number) { return this.common.put(`TaskDocument/UpdateStatus/${id}/${status}`, {}, true, true); }

  /** Upload files + create TkDocument records in OCR queue (no OCR immediately). */
  createOcrBatch(files: File[]) {
    return this.common.uploadFiles('TaskDocument/CreateOcrBatch', files, undefined, undefined, true, true);
  }

  /** Get current OCR queue statistics (total pending + user's items). */
  getOcrQueueStatus() {
    return this.common.get('TaskDocument/OcrQueueStatus', {}, false);
  }

  /** Import nhiệm vụ từ file Excel. */
  importExcel(file: File) {
    return this.common.uploadFiles('TaskDocument/ImportExcel', [file], undefined, undefined, true, true);
  }
}
