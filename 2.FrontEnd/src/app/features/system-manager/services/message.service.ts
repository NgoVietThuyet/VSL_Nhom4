import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { MessageDto } from '../models';

@Injectable({
    providedIn: 'root',
})
export class MessageService {
    constructor(private common: CommonService) { }

    search(params: MessageDto) { return this.common.get('Message/Search', params) }

    insert(data: MessageDto) { return this.common.post('Message/Insert', data) }

    update(data: MessageDto) { return this.common.put('Message/Update', data) }

    detail(data: string) { return this.common.get(`Message/Detail/${data}`, {}) }
}
