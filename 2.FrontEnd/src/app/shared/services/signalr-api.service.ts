import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class SignalRApiService {
  constructor(private common: CommonService) {}

  getOnlineUsers(): Observable<any> {
    return this.common.get('SignalR/OnlineUsers', {}, false);
  }

  isConnected(userName: string): Observable<any> {
    return this.common.get(`SignalR/IsConnected/${userName}`, {}, false);
  }

  getCurrentUserConnection(): Observable<any> {
    return this.common.get('SignalR/CurrentUserConnection', {}, false);
  }

  getBatchConnectionStatus(userNames: string[]): Observable<any> {
    return this.common.post('SignalR/BatchConnectionStatus', userNames || [], false);
  }
}
