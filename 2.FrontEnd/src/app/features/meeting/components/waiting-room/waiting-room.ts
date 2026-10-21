import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { MeetingService } from '../../services/meeting.service';
import { MeetingRealtimeService } from '../../services/meeting-realtime.service';
import { LocalStorageUtils } from '../../../../shared/utils';
import { TokenService } from '../../../../core/services/token.service';

@Component({
  standalone: true,
  selector: 'app-waiting-room',
  imports: [SharedModules],
  templateUrl: './waiting-room.html',
  styleUrl: './waiting-room.scss'
})
export class WaitingRoom implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  meetingId = '';
  meetingName = '';
  meetingStatus: number | null = null;

  accountInfo: any;
  isGuestAccount = false;
  isWaiting = true;
  hasSentRequest = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private _service: MeetingService,
    private meetingRealtime: MeetingRealtimeService,
    private tokenService: TokenService
  ) {
    this.meetingId = this.route.snapshot.paramMap.get('meetingId') ?? '';
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
    this.isGuestAccount = this.accountInfo?.isGuest === true || this.accountInfo?.isGuest === 'true';
  }

  ngOnInit(): void {
    this.meetingRealtime.start();
    this.loadMeetingInfo();
    this.listenForApproval();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMeetingInfo(): void {
    this._service.getInfoMeeting(this.meetingId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.meetingName = data?.name ?? '';
        this.meetingStatus = data?.status ?? null;
        this.sendJoinRequest();
      },
      error: () => {
        this.sendJoinRequest();
      }
    });
  }

  private sendJoinRequest(): void {
    if (this.hasSentRequest) return;
    this.hasSentRequest = true;

    const userName = this.accountInfo?.userName || this.accountInfo?.UserName || '';
    const fullName = this.accountInfo?.fullName || this.accountInfo?.FullName || userName;

    this._service.requestJoinApproval({
      meetingId: this.meetingId,
      username: userName,
      message: fullName
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  private listenForApproval(): void {
    this.meetingRealtime.waitingRoomApproved$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data?.meetingId && data.meetingId !== this.meetingId) return;

        this.isWaiting = false;
        this.message.success('Chủ trì đã chấp nhận bạn tham gia cuộc họp');

        sessionStorage.setItem(`meeting_approved_${this.meetingId}`, 'true');

        setTimeout(() => {
          this.router.navigate([`/meeting/detail/${this.meetingId}`]);
        }, 500);
      });

    this.meetingRealtime.waitingRoomRejected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data?.meetingId && data.meetingId !== this.meetingId) return;

        this.isWaiting = false;
        this.message.error('Chủ trì đã từ chối bạn tham gia cuộc họp');

        setTimeout(() => {
          if (this.isGuestAccount) {
            LocalStorageUtils.clear();
            this.tokenService.clear();
            this.router.navigate(['/login']);
          } else {
            this.router.navigate(['/meeting/home']);
          }
        }, 1500);
      });
  }

  backToHome(): void {
    if (this.isGuestAccount) {
      LocalStorageUtils.clear();
      this.tokenService.clear();
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/meeting/home']);
    }
  }
}
