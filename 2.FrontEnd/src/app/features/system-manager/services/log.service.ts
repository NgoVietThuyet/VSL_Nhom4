import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';

@Injectable({
    providedIn: 'root',
})
export class LogService {
    constructor(private common: CommonService) { }

    /** Lấy `limit` bản ghi mới nhất trong ngày hôm nay (mặc định 200) */
    search(limit: number = 200) {
        return this.common.get('Log/Search', { limit });
    }
}
