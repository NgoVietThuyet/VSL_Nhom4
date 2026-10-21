import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SignalRService } from './signalr.service';

export interface IncomingCallPayload {
  conversationId: string;
  roomName: string;
  callerUserName: string;
  callerFullName: string;
  isVideo: boolean;
}

@Injectable({ providedIn: 'root' })
export class CallStateService implements OnDestroy {
  /** The active incoming call that has not been answered or dismissed. */
  incomingCall$ = new BehaviorSubject<IncomingCallPayload | null>(null);

  /**
   * Set when the user clicks "Accept" in the main-layout overlay.
   * chat.ts subscribes and opens Jitsi when non-null.
   * BehaviorSubject so it replays if chat hasn't mounted yet.
   */
  acceptedCall$ = new BehaviorSubject<IncomingCallPayload | null>(null);

  private ringTimeout: any = null;
  private readonly destroy$ = new Subject<void>();

  constructor(private signalR: SignalRService) {}

  /** Call from main-layout after signalR is started. */
  listenForCalls() {
    this.signalR.callSignal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ signalType, payload }) => {
        switch (signalType) {
          case 'IncomingCall':
            this.incomingCall$.next(payload as IncomingCallPayload);
            if (this.ringTimeout) clearTimeout(this.ringTimeout);
            this.ringTimeout = setTimeout(() => this.incomingCall$.next(null), 30000);
            break;
          case 'CallCancelled':
            if (this.incomingCall$.value?.conversationId === payload.conversationId) {
              this.clearIncoming();
            }
            break;
        }
      });
  }

  /** Triggered by main-layout when user clicks "Accept". */
  acceptCall(call: IncomingCallPayload) {
    this.clearIncoming();
    this.signalR.sendCallSignal(call.callerUserName, 'CallAccepted', { conversationId: call.conversationId });
    this.acceptedCall$.next(call);
  }

  /** Triggered by main-layout when user clicks "Reject". */
  rejectCall(call: IncomingCallPayload) {
    this.clearIncoming();
    this.signalR.sendCallSignal(call.callerUserName, 'CallRejected', { conversationId: call.conversationId });
  }

  /** Called by chat.ts once it has consumed the accepted call and opened Jitsi. */
  clearAcceptedCall() {
    this.acceptedCall$.next(null);
  }

  /** Called when already in a call and IncomingCall arrives — auto-reject busy. */
  rejectBusy(call: IncomingCallPayload) {
    this.clearIncoming();
    this.signalR.sendCallSignal(call.callerUserName, 'CallRejected', { conversationId: call.conversationId, reason: 'busy' } as any);
  }

  private clearIncoming() {
    if (this.ringTimeout) {
      clearTimeout(this.ringTimeout);
      this.ringTimeout = null;
    }
    this.incomingCall$.next(null);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearIncoming();
  }
}
