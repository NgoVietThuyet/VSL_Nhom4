import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { EnvironmentService } from '../../../core';

@Injectable({ providedIn: 'root' })
export class SyncUpdateService {
    private baseUrl: string;

    constructor(private common: CommonService, private env: EnvironmentService) {
        this.baseUrl = this.env.getEnv('baseUrl') || '';
    }

    getLatest() {
        return this.common.get('SyncUpdate/Latest', {});
    }

    getList() {
        return this.common.get('SyncUpdate/List', {});
    }

    upload(file: File, releaseNote: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('releaseNote', releaseNote);
        return this.common.post('SyncUpdate/Upload', formData);
    }

    delete(id: number) {
        return this.common.delete(`SyncUpdate/${id}`);
    }

    getDownloadUrl(id: number): string {
        return `${this.baseUrl}/SyncUpdate/Download/${id}`;
    }
}
