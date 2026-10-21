import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { EnvironmentService, TokenService } from '../../core';
import { ChatMessageDto } from '../../features/chat/models';
import { SignalRAction } from '../../features/meeting/models/signalR-action.static';
import { NotificationDto } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private isStarting = false;
  private isStopping = false;
  private joinedMeetingGroups = new Set<string>();

  messageReceived$ = new Subject<ChatMessageDto>();
  userOnline$ = new Subject<string>();
  userOffline$ = new Subject<string>();
  connectionState$ = new Subject<signalR.HubConnectionState>();
  typingReceived$ = new Subject<{ conversationId: string; userName: string }>();
  messageRecalled$ = new Subject<ChatMessageDto>();
  messagePinned$ = new Subject<ChatMessageDto>();
  reactionUpdated$ = new Subject<any>();
  allReactionsRemoved$ = new Subject<any>();
  conversationRead$ = new Subject<any>();
  notificationReceived$ = new Subject<NotificationDto>();
  notificationReadStateChanged$ = new Subject<any>();
  callSignal$ = new Subject<{ signalType: string; payload: any }>();
  dashboardUpdate$ = new Subject<void>();
  ocrComplete$ = new Subject<OcrCompleteEvent>();
  taskEvent$ = new Subject<any>();
  calendarEvent$ = new Subject<any>();
  explorerEvent$ = new Subject<any>();
  noteEvent$ = new Subject<any>();
  reportEvent$ = new Subject<any>();

  systemMonitorEvent$ = new Subject<any>();
  logEvent$ = new Subject<any>();

  raiseHand$ = new Subject<any>();
  startMeeting$ = new Subject<any>();
  endMeeting$ = new Subject<any>();
  startRecording$ = new Subject<any>();
  endRecording$ = new Subject<any>();
  updateMeeting$ = new Subject<any>();
  intoTheMeeting$ = new Subject<any>();
  exitTheMeeting$ = new Subject<any>();
  createMeetingVote$ = new Subject<any>();
  startVoting$ = new Subject<any>();
  endVoting$ = new Subject<any>();
  sendMessage$ = new Subject<any>();
  kickParticipant$ = new Subject<any>();
  controlParticipant$ = new Subject<any>();
  syncParticipantState$ = new Subject<any>();
  toggleAllMedia$ = new Subject<any>();
  broadcastTranscription$ = new Subject<any>();
  requestJoinApproval$ = new Subject<any>();
  approveJoinRequest$ = new Subject<any>();
  rejectJoinRequest$ = new Subject<any>();

  constructor(
    private env: EnvironmentService,
    private tokenService: TokenService,
  ) {}

  start() {
    if (this.hubConnection || this.isStarting || !this.hasValidToken()) return;
    this.isStarting = true;

    const baseUrl = this.env.getEnv('baseUrl') || '';
    const hubUrl = baseUrl.replace('/api', '') + '/api/Hub/Notification';

    this.startConnection(hubUrl, 'websocket-direct')
      .catch(() => this.startConnection(hubUrl, 'negotiate'))
      .catch(() => this.startConnection(hubUrl, 'long-polling'))
      .then(() => {
        this.isStarting = false;
        this.logActiveTransport();
        this.connectionState$.next(signalR.HubConnectionState.Connected);
        this.rejoinMeetingGroups();
      })
      .catch(() => {
        this.isStarting = false;
        this.hubConnection = null;
        this.retryStart();
      });
  }

  stop() {
    this.isStopping = true;
    if (this.hubConnection) {
      this.hubConnection.stop().finally(() => {
        this.isStopping = false;
      });
      this.hubConnection = null;
      this.isStarting = false;
    } else {
      this.isStopping = false;
    }
    this.joinedMeetingGroups.clear();
  }

  joinMeetingGroup(meetingId: string): Promise<void> {
    const normalizedMeetingId = (meetingId || '').toString().trim();
    if (!normalizedMeetingId) {
      return Promise.resolve();
    }

    this.joinedMeetingGroups.add(normalizedMeetingId);

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinMeetingGroup', normalizedMeetingId).catch(() => {});
    }

    return Promise.resolve();
  }

  leaveMeetingGroup(meetingId: string): Promise<void> {
    const normalizedMeetingId = (meetingId || '').toString().trim();
    if (!normalizedMeetingId) {
      return Promise.resolve();
    }

    this.joinedMeetingGroups.delete(normalizedMeetingId);

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('LeaveMeetingGroup', normalizedMeetingId).catch(() => {});
    }

    return Promise.resolve();
  }

  sendTyping(conversationId: string, participantUserNames: string[]) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendTyping', conversationId, participantUserNames).catch(() => {});
    }
  }

  sendCallSignal(targetUserName: string, signalType: string, payload: any) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendCallSignal', targetUserName, signalType, payload).catch(() => {});
    }
  }

  joinCall(conversationId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinCall', conversationId).catch(() => {});
    }
    return Promise.resolve();
  }

  leaveCall(conversationId: string): Promise<boolean> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke<boolean>('LeaveCall', conversationId).catch(() => true);
    }
    return Promise.resolve(true);
  }

  /** Đăng ký nhận log realtime từ server (join group log-watchers) */
  joinLogWatchers(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('JoinLogWatchers').catch(() => {});
    }
    return Promise.resolve();
  }

  /** Hủy nhận log realtime (leave group log-watchers) */
  leaveLogWatchers(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return this.hubConnection.invoke('LeaveLogWatchers').catch(() => {});
    }
    return Promise.resolve();
  }

  get isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  private registerLifecycleHandlers() {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting(() => {
      this.connectionState$.next(signalR.HubConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState$.next(signalR.HubConnectionState.Connected);
      this.rejoinMeetingGroups();
    });

    this.hubConnection.onclose(() => {
      if (this.isStopping) {
        this.isStopping = false;
        return;
      }

      this.connectionState$.next(signalR.HubConnectionState.Disconnected);
      this.hubConnection = null;
      this.isStarting = false;
      this.retryStart();
    });
  }

  private async startConnection(hubUrl: string, mode: 'websocket-direct' | 'negotiate' | 'long-polling'): Promise<void> {
    this.hubConnection = this.buildHubConnection(hubUrl, mode);
    this.registerLifecycleHandlers();
    this.registerEventHandlers();
    await this.hubConnection.start();
  }

  private buildHubConnection(
    hubUrl: string,
    mode: 'websocket-direct' | 'negotiate' | 'long-polling'
  ): signalR.HubConnection {
    const builder = new signalR.HubConnectionBuilder();

    if (mode === 'websocket-direct') {
      builder.withUrl(hubUrl, {
        accessTokenFactory: () => this.tokenService.getAccessToken() || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      });
    } else if (mode === 'long-polling') {
      builder.withUrl(hubUrl, {
        accessTokenFactory: () => this.tokenService.getAccessToken() || '',
        transport: signalR.HttpTransportType.LongPolling,
      });
    } else {
      builder.withUrl(hubUrl, {
        accessTokenFactory: () => this.tokenService.getAccessToken() || ''
      });
    }

    return builder
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }

  private logActiveTransport() {
    const transportName =
      (this.hubConnection as any)?.connection?.transport?.constructor?.name ||
      'UnknownTransport';
    console.info('[SignalR] Connected transport:', transportName);
  }

  private registerEventHandlers() {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveChatMessage', (message: ChatMessageDto) => this.messageReceived$.next(message));
    this.hubConnection.on('UserOnline', (userName: string) => this.userOnline$.next(userName));
    this.hubConnection.on('UserOffline', (userName: string) => this.userOffline$.next(userName));
    this.hubConnection.on('DashboardUpdate', () => this.dashboardUpdate$.next());
    this.hubConnection.on('UserTyping', (data: { conversationId: string; userName: string }) => this.typingReceived$.next(data));
    this.hubConnection.on('MessageRecalled', (message: ChatMessageDto) => this.messageRecalled$.next(message));
    this.hubConnection.on('MessagePinned', (message: ChatMessageDto) => this.messagePinned$.next(message));
    this.hubConnection.on('ReactionUpdated', (data: any) => this.reactionUpdated$.next(data));
    this.hubConnection.on('AllReactionsRemoved', (data: any) => this.allReactionsRemoved$.next(data));
    this.hubConnection.on('ConversationRead', (data: any) => this.conversationRead$.next(data));
    this.hubConnection.on('ReceiveNotification', (data: any) => {
      if (data?.action === 'OcrComplete') {
        this.emitOcrComplete(data);
      } else {
        this.notificationReceived$.next(data as NotificationDto);
      }
    });
    this.hubConnection.on('NotificationReadStateChanged', (data: any) => this.notificationReadStateChanged$.next(data));
    this.hubConnection.on('CallSignal', (signalType: string, payload: any) => this.callSignal$.next({ signalType, payload }));
    this.hubConnection.on('TaskEvent', (data: any) => this.taskEvent$.next(data));
    this.hubConnection.on('CalendarEvent', (data: any) => this.calendarEvent$.next(data));
    this.hubConnection.on('ExplorerEvent', (data: any) => this.explorerEvent$.next(data));
    this.hubConnection.on('NoteEvent', (data: any) => this.noteEvent$.next(data));
    this.hubConnection.on('SystemMonitorEvent', (data: any) => this.systemMonitorEvent$.next(data));
    this.hubConnection.on('LogEvent', (data: any) => this.logEvent$.next(data));
    this.hubConnection.on('ReportEvent', (data: any) => this.reportEvent$.next(data));

    this.hubConnection.on('MeetingEvent', (data: any) => this.dispatchMeetingEvent(data));
    this.hubConnection.on('WaitingRoomEvent', (data: any) => this.dispatchWaitingRoomEvent(data));
  }

  private dispatchMeetingEvent(data: any) {
    switch (data?.action) {
      case SignalRAction.RaiseHand:
        this.raiseHand$.next(data);
        break;
      case SignalRAction.StartMeeting:
        this.startMeeting$.next(data);
        break;
      case SignalRAction.EndMeeting:
        this.endMeeting$.next(data);
        break;
      case SignalRAction.StartRecord:
        this.startRecording$.next(data);
        break;
      case SignalRAction.EndRecord:
        this.endRecording$.next(data);
        break;
      case SignalRAction.UpdateMeeting:
        this.updateMeeting$.next(data);
        break;
      case SignalRAction.IntoTheMeeting:
        this.intoTheMeeting$.next(data);
        break;
      case SignalRAction.ExitTheMeeting:
        this.exitTheMeeting$.next(data);
        break;
      case SignalRAction.CreateMeetingVote:
        this.createMeetingVote$.next(data);
        break;
      case SignalRAction.StartVoting:
        this.startVoting$.next(data);
        break;
      case SignalRAction.EndVoting:
        this.endVoting$.next(data);
        break;
      case SignalRAction.SendMessage:
        this.sendMessage$.next(data);
        break;
      case SignalRAction.KickParticipant:
        this.kickParticipant$.next(data);
        break;
      case SignalRAction.ControlParticipant:
        this.controlParticipant$.next(data);
        break;
      case SignalRAction.SyncParticipantState:
        this.syncParticipantState$.next(data);
        break;
      case SignalRAction.ToggleAllMedia:
        this.toggleAllMedia$.next(data);
        break;
      case SignalRAction.BroadcastTranscription:
        this.broadcastTranscription$.next(data);
        break;
      case SignalRAction.RequestJoinApproval:
        this.requestJoinApproval$.next(data);
        break;
      default:
        break;
    }
  }

  private dispatchWaitingRoomEvent(data: any) {
    switch (data?.action) {
      case SignalRAction.ApproveJoinRequest:
        this.approveJoinRequest$.next(data);
        break;
      case SignalRAction.RejectJoinRequest:
        this.rejectJoinRequest$.next(data);
        break;
      default:
        break;
    }
  }

  private retryStart() {
    if (this.hasValidToken()) {
      setTimeout(() => this.start(), 1500);
    }
  }

  private rejoinMeetingGroups() {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    this.joinedMeetingGroups.forEach((meetingId) => {
      this.hubConnection?.invoke('JoinMeetingGroup', meetingId).catch(() => {});
    });
  }

  private hasValidToken(): boolean {
    return this.tokenService.hasValidAccessToken();
  }

  private emitOcrComplete(data: any): void {
    const message = data?.message ?? '';
    const total = data?.total ?? 0;
    const success = data?.success ?? 0;
    const fail = data?.fail ?? 0;
    this.ocrComplete$.next({ message, success, fail, total });
  }
}

export interface OcrCompleteEvent {
  message: string;
  success: number;
  fail: number;
  total: number;
}
