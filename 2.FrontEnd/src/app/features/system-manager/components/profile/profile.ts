import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GlobalService } from '../../../../core/services/global.service';
import { AccountService } from '../../services/account.service';
import { HistoryLoginService } from '../../services/history-login.service';
import { TitleService } from '../../../master-data/services/title.service';
import { MainLayoutService } from '../../../../shared/services/main-layout.service';
import { SharedModules } from '../../../../shared/ng-zorro.module';
import { LocalStorageUtils } from '../../../../shared/utils/local-storage.utils';
import { AccountDto, HistoryLoginDto } from '../../models';
import { TitleDto } from '../../../master-data/models';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { PaginationResult } from '../../../../shared/models';

@Component({
  selector: 'app-profile',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  accountInfo: any;
  dto: AccountDto = new AccountDto();
  lstTitle: any[] = [];

  historyData: PaginationResult = new PaginationResult();
  historyFilter: HistoryLoginDto = new HistoryLoginDto();

  changePasswordModel = {
    userName: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  isEditMode: boolean = false;
  showCurrentPass: boolean = false;
  showNewPass: boolean = false;
  showConfirmPass: boolean = false;
  avatarUploading = false;
  avatarCacheBust = Date.now();

  constructor(
    private global: GlobalService,
    private accountService: AccountService,
    private historyLoginService: HistoryLoginService,
    private titleService: TitleService,
    private mainLayoutService: MainLayoutService,
    private message: NzMessageService
  ) {
    this.global.setBreadcrumb([
      { name: 'Thông tin cá nhân', path: 'system-manager/profile' }
    ]);
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadTitles();
    this.loadLoginHistory();
  }

  loadProfile(): void {
    if (!this.accountInfo?.userName) return;
    this.accountService.myProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.dto = res?.data ?? res;
        }
      });
  }

  loadTitles(): void {
    const filter = new TitleDto();
    filter.pageSize = 1000;
    this.titleService.search(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.lstTitle = res.data || [];
        }
      });
  }

  loadLoginHistory(): void {
    this.historyFilter.userName = this.accountInfo?.userName || '';
    this.historyLoginService.search(this.historyFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.historyData = res;
        }
      });
  }

  saveProfile(): void {
    this.accountService.updateMyProfile(this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.isEditMode = false;
            const updated = this.global.updateStoredAccountInfo({ ...this.dto });
            this.accountInfo = updated;
          }
        }
      });
  }

  getAvatarUrl(): string | null {
    return this.global.getAccountAvatarUrl(
      this.dto?.userName || this.accountInfo?.userName,
      this.dto?.avatarFileId || this.accountInfo?.avatarFileId,
      this.avatarCacheBust
    );
  }

  beforeUploadAvatar = (file: NzUploadFile | File): boolean => {
    const raw = file instanceof File ? file : (file.originFileObj as File);
    if (!raw) {
      this.message.error('Không đọc được file ảnh');
      return false;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(raw.type)) {
      this.message.error('Chỉ chấp nhận file ảnh JPG, PNG, WEBP, GIF');
      return false;
    }
    if (raw.size > 2 * 1024 * 1024) {
      this.message.error('Ảnh đại diện tối đa 2MB');
      return false;
    }

    const userName = this.dto?.userName || this.accountInfo?.userName;
    if (!userName) {
      this.message.error('Không xác định được tài khoản');
      return false;
    }

    this.avatarUploading = true;
    this.accountService.uploadAvatar(userName, raw)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.avatarUploading = false; })
      )
      .subscribe({
        next: (res: any) => {
          if (!res?.status) return;
          const avatarFileId = res?.data?.avatarFileId ?? res?.data?.AvatarFileId;
          this.dto.avatarFileId = avatarFileId;
          this.avatarCacheBust = Date.now();
          const updated = this.global.updateStoredAccountInfo({ avatarFileId, avatarVersion: this.avatarCacheBust });
          this.accountInfo = updated;
          this.message.success('Cập nhật ảnh đại diện thành công');
        }
      });
    return false;
  };

  removeAvatar(): void {
    const userName = this.dto?.userName || this.accountInfo?.userName;
    if (!userName) return;
    this.accountService.removeAvatar(userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res?.status) return;
          this.dto.avatarFileId = '';
          this.avatarCacheBust = Date.now();
          this.global.updateStoredAccountInfo({ avatarFileId: '', avatarVersion: this.avatarCacheBust });
          this.message.success('Đã xóa ảnh đại diện');
        }
      });
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmNewPassword } = this.changePasswordModel;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.message.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.message.error('Mật khẩu xác nhận không khớp với mật khẩu mới!');
      return;
    }

    this.changePasswordModel.userName = this.accountInfo.userName;
    this.mainLayoutService.changePassword(this.changePasswordModel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.resetChangePassword();
             this.message.success('Đã đổi mật khẩu thành công!');
          }
          else
          {
            this.resetChangePassword();
            this.message.error('Đã xảy ra lỗi trong lúc đổi mật khẩu!');
          }
        }
      });
  }

  resetChangePassword(): void {
    this.changePasswordModel = {
      userName: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    };
    this.showCurrentPass = false;
    this.showNewPass = false;
    this.showConfirmPass = false;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.loadProfile();
  }

  getInitials(): string {
    return this.global.getInitialsAvatar(this.dto?.fullName || this.accountInfo?.fullName || '');
  }

  getAvatarColor(): string {
    return this.global.getAvatarColor(this.dto?.userName || this.accountInfo?.userName || '');
  }

  getTitleName(): string {
    const code = this.dto?.titleCode || this.accountInfo?.titleCode;
    if (!code) return '';
    const found = this.lstTitle.find(t => t.code === code);
    return found?.name || code;
  }

  getIsActive(): boolean {
    return (this.dto as any)?.isActive ?? this.accountInfo?.isActive ?? true;
  }

  pageIndexChange(e: any): void {
    this.historyFilter.currentPage = e;
    this.loadLoginHistory();
  }

  pageSizeChange(e: any): void {
    this.historyFilter.pageSize = e;
    this.loadLoginHistory();
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
