import { Injectable } from '@angular/core';
import { CommonService } from './common.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private common: CommonService) {}

    getByUser(page: number = 1, pageSize: number = 20) {
        return this.common.get(`Notification/GetByUser?page=${page}&pageSize=${pageSize}`,{},false);
    }

    getUnreadCount() {
        return this.common.get('Notification/UnreadCount');
    }

    markAsRead(id: string) {
        return this.common.post(`Notification/MarkAsRead/${id}`, {});
    }

    markAllAsRead() {
        return this.common.post('Notification/MarkAllAsRead', {});
    }
}
