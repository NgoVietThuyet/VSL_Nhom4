import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../../shared/services';
import { EnvironmentService } from '../../../core';
import { MailComposeDto, MailMessageDto } from '../models/mail.models';

@Injectable({ providedIn: 'root' })
export class MailService {
  constructor(
    private common: CommonService,
    private http: HttpClient,
    private env: EnvironmentService
  ) { }

  search(filter: Partial<MailMessageDto> = {}, showLoading: boolean = true) {
    return this.common.get('Mail/Search', filter, showLoading);
  }

  getLabels() {
    return this.common.get('Mail/Labels', {}, false);
  }

  getFolders(mailType: string, showLoading: boolean = true) {
    return this.common.get('Mail/Folders', { mailType }, showLoading);
  }

  detail(id: string) {
    return this.common.get(`Mail/Detail/${id}`, {}, true);
  }

  compose(dto: MailComposeDto) {
    return this.common.post('Mail/Compose', dto);
  }

  updateReadState(id: string, isRead: boolean) {
    return this.common.put(`Mail/ReadState/${id}?isRead=${isRead}`, {});
  }

  updateStarState(id: string, isStarred: boolean) {
    return this.common.put(`Mail/Star/${id}?isStarred=${isStarred}`, {});
  }

  delete(id: string, permanent: boolean = false) {
    return this.common.delete(`Mail/Delete/${id}?permanent=${permanent}`, {});
  }

  suggestContacts(keyword: string) {
    return this.common.get('Mail/SuggestContacts', { keyword }, false);
  }

  /**
   * Tải xuống file đính kèm từ MinIO (object name = attachmentId)
   */
  downloadAttachment(attachmentId: string, fileName: string): void {
    const url = `${this.env.getEnv('baseUrl')}/Mail/Attachment/Download/${attachmentId}`;
    this.http.get(url, { observe: 'response', responseType: 'blob' }).subscribe({
      next: (response: any) => {
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        const blob = new Blob([response.body!], { type: contentType });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName || 'attachment';
        link.click();
        window.URL.revokeObjectURL(link.href);
      },
      error: () => console.error('[MailService] Cannot download attachment')
    });
  }
}
