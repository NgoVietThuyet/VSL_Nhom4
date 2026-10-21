import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from './signalr.service';
import { SignalRApiService } from './signalr-api.service';
import { LocalStorageUtils } from '../utils';
import * as SignalRLib from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class OnlinePresenceService {
  private readonly onlineUsersSubject = new BehaviorSubject<Set<string>>(new Set());
  onlineUsers$ = this.onlineUsersSubject.asObservable();
  private initialized = false;

  constructor(
    private signalRApi: SignalRApiService,
    private signalR: SignalRService,
  ) {
    this.signalR.userOnline$.subscribe((userName) => this.updateUserState(userName, true));
    this.signalR.userOffline$.subscribe((userName) => this.updateUserState(userName, false));
    this.signalR.connectionState$.subscribe((state) => {
      if (state === SignalRLib.HubConnectionState.Connected) {
        this.ensureCurrentUserOnline();
      }
    });
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.signalRApi.getOnlineUsers().subscribe({
      next: (res: any) => {
        this.setUsers(res || []);
        this.ensureCurrentUserOnline();
      },
      error: () => {
        this.initialized = false;
      },
    });
  }

  reset(): void {
    this.initialized = false;
    this.onlineUsersSubject.next(new Set());
  }

  getSnapshot(): Set<string> {
    return new Set(this.onlineUsersSubject.value);
  }

  private setUsers(users: string[]): void {
    const normalized = (users || [])
      .map((x) => (x || '').toString().trim().toLowerCase())
      .filter((x) => !!x);

    this.onlineUsersSubject.next(new Set(normalized));
  }

  private updateUserState(userName: string, isOnline: boolean): void {
    const normalizedUser = (userName || '').toString().trim().toLowerCase();
    if (!normalizedUser) return;

    const nextSet = new Set(this.onlineUsersSubject.value);
    if (isOnline) {
      nextSet.add(normalizedUser);
    } else {
      nextSet.delete(normalizedUser);
    }

    this.onlineUsersSubject.next(nextSet);
  }

  private ensureCurrentUserOnline(): void {
    const accountInfo = LocalStorageUtils.getItem('accountInfo');
    const currentUser = (accountInfo?.userName || accountInfo?.UserName || '').toString().trim().toLowerCase();
    if (!currentUser) return;

    const nextSet = new Set(this.onlineUsersSubject.value);
    nextSet.add(currentUser);
    this.onlineUsersSubject.next(nextSet);
  }
}
