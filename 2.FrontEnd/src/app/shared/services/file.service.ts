import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';
import { EnvironmentService, TokenService } from '../../core';
import {
    OnlyOfficeFileScope,
    requestOnlyOfficeDownloadTicket,
} from '../utils/onlyoffice-helper';

@Injectable({
    providedIn: 'root',
})
export class FileService {
    constructor(
        private common: CommonService,
        private http: HttpClient,
        private env: EnvironmentService,
        private tokenService: TokenService,
    ) { }

    upload(data: any) {
        return this.common.post(`File/Upload`, data, true);
    }

    uploadFiles(files: File[], showLoading = true) {
        return this.common.uploadFiles('File/Upload', files, undefined, undefined, showLoading);
    }

    getById(fileId: string) {
        return this.common.get(`File/GetById/${fileId}`, {}, false);
    }

    getDownloadUrl(fileId: string, ticket?: string): string {
        const base = this.env.getEnv('baseUrl');
        if (ticket) {
            return `${base}/File/Download/${fileId}?dl=${encodeURIComponent(ticket)}`;
        }
        return `${base}/File/Download/${fileId}`;
    }

    requestDownloadTicket(fileId: string) {
        return this.common.get<{ ticket?: string }>(`File/DownloadTicket/${fileId}`, {}, false);
    }

    requestOnlyOfficeTicket(
        fileId: string,
        scope: OnlyOfficeFileScope = 'Explorer',
    ): Observable<string | null> {
        return requestOnlyOfficeDownloadTicket(
            this.common,
            this.tokenService,
            fileId,
            scope,
        );
    }

    download(fileId: string): void {
        this.http.get(`${this.env.getEnv('baseUrl')}/File/Download/${fileId}`, {
            observe: 'response',
            responseType: 'blob'
        }).subscribe({
            next: (response: any) => {
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const error = JSON.parse(reader.result as string);
                        alert(error.messageObject?.message || 'Không thể tải file!');
                    };
                    reader.readAsText(response.body);
                    return;
                }

                const blob = new Blob([response.body!], { type: contentType || 'application/octet-stream' });
                const contentDisposition = response.headers.get('content-disposition');
                const fileName = this.extractFilename(contentDisposition) || 'downloaded-file';
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(link.href);
            },
            error: () => alert('Không thể tải file. Vui lòng thử lại.')
        });
    }

    uploadAndSaveInMeeting(data: any) {
        return this.common.post(`File/UploadAndSaveInMeeting`, data, true);
    }

    getByRefrence(refrenceFileId: any) {
        return this.common.get(`File/GetByRefrence/${refrenceFileId}`, {}, false);
    }

    private extractFilename(disposition: string | null): string | null {
        const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        return match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : null;
    }
}
