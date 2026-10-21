import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SignalRService } from '../../../shared/services/signalr.service';

@Injectable({
  providedIn: 'root',
})
export class MeetingRealtimeService {
  constructor(private signalR: SignalRService) {}

  start(): void {
    this.signalR.start();
  }

  joinMeetingChannel(meetingId: string): Promise<void> {
    return this.signalR.joinMeetingGroup(meetingId);
  }

  leaveMeetingChannel(meetingId: string): Promise<void> {
    return this.signalR.leaveMeetingGroup(meetingId);
  }

  get raiseHand$(): Observable<any> {
    return this.signalR.raiseHand$;
  }

  meetingStarted$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.startMeeting$, meetingId);
  }

  meetingEnded$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.endMeeting$, meetingId);
  }

  recordingStarted$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.startRecording$, meetingId);
  }

  recordingEnded$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.endRecording$, meetingId);
  }

  intoMeeting$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.intoTheMeeting$, meetingId);
  }

  exitMeeting$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.exitTheMeeting$, meetingId);
  }

  chatMessageReceived$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.sendMessage$, meetingId);
  }

  voteCreated$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.createMeetingVote$, meetingId);
  }

  votingStarted$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.startVoting$, meetingId);
  }

  votingEnded$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.endVoting$, meetingId);
  }

  get participantKicked$(): Observable<any> {
    return this.signalR.kickParticipant$;
  }

  get participantControlled$(): Observable<any> {
    return this.signalR.controlParticipant$;
  }

  get participantStateSynced$(): Observable<any> {
    return this.signalR.syncParticipantState$;
  }

  get allMediaToggled$(): Observable<any> {
    return this.signalR.toggleAllMedia$;
  }

  get transcriptionBroadcasted$(): Observable<any> {
    return this.signalR.broadcastTranscription$;
  }

  requestJoinApproval$(meetingId: string): Observable<any> {
    return this.byMeeting(this.signalR.requestJoinApproval$, meetingId);
  }

  get waitingRoomApproved$(): Observable<any> {
    return this.signalR.approveJoinRequest$;
  }

  get waitingRoomRejected$(): Observable<any> {
    return this.signalR.rejectJoinRequest$;
  }

  private byMeeting(stream$: Observable<any>, meetingId: string): Observable<any> {
    return stream$.pipe(
      filter((data: any) => !data?.meetingId || data.meetingId === meetingId)
    );
  }
}
