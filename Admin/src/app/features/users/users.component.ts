import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';

export interface AdminUser {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  xp?: number;
  level?: number;
  streakDays?: number;
  status: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private readonly API = API_BASE + '/admin/users';

  users: AdminUser[] = [];
  loading = false;
  searchQuery = '';
  selectedRole: string | null = null;
  selectedStatus: string | null = null;

  pageIndex = 1;
  pageSize = 20;

  // Drawer Thêm / Sửa
  visible = false;
  isEdit = false;
  saving = false;
  dto: any = {};

  // Drawer chi tiết hồ sơ
  showDetail = false;
  detailData: any = null;

  // Modal đặt lại mật khẩu
  resetVisible = false;
  resetTarget: AdminUser | null = null;
  newPassword = '123456';

  constructor(private http: HttpClient, private message: NzMessageService) {}

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.pageIndex = 1;

    const params: string[] = [];
    if (this.searchQuery.trim()) params.push(`search=${encodeURIComponent(this.searchQuery.trim())}`);
    if (this.selectedRole) params.push(`role=${this.selectedRole}`);
    if (this.selectedStatus) params.push(`status=${this.selectedStatus}`);
    const url = params.length ? `${this.API}?${params.join('&')}` : this.API;

    this.http.get<{ code: number; data: AdminUser[] }>(url).subscribe({
      next: (res) => {
        this.users = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải danh sách người dùng từ máy chủ.');
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.searchQuery = '';
    this.selectedRole = null;
    this.selectedStatus = null;
    this.search();
  }

  onKeydownSearch(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.search();
  }

  open(user?: AdminUser): void {
    this.isEdit = !!user;
    this.dto = user
      ? { ...user }
      : { fullName: '', email: '', password: '', phone: '', role: 'STUDENT', level: 1, avatarUrl: '' };
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  save(): void {
    if (!this.dto.fullName || !this.dto.email) {
      this.message.warning('Vui lòng nhập họ tên và email');
      return;
    }

    this.saving = true;
    const req = this.isEdit
      ? this.http.put(`${this.API}/${this.dto.userId}`, this.dto)
      : this.http.post(this.API, this.dto);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.visible = false;
        this.message.success(this.isEdit ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công');
        this.search();
      },
      error: (err) => {
        this.saving = false;
        this.message.error(err?.error?.message || (this.isEdit ? 'Lỗi cập nhật người dùng' : 'Lỗi thêm người dùng'));
      }
    });
  }

  toggleStatus(user: AdminUser): void {
    this.http.patch(`${this.API}/${user.userId}/status`, {}).subscribe({
      next: () => {
        this.message.success(user.status ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản');
        this.search();
      },
      error: (err) => this.message.error(err?.error?.message || 'Lỗi thay đổi trạng thái')
    });
  }

  openResetPassword(user: AdminUser): void {
    this.resetTarget = user;
    this.newPassword = '123456';
    this.resetVisible = true;
  }

  confirmResetPassword(): void {
    if (!this.resetTarget || !this.newPassword) return;
    const email = this.resetTarget.email;
    this.http.post(`${this.API}/${this.resetTarget.userId}/reset-password`, { newPassword: this.newPassword }).subscribe({
      next: () => {
        this.resetVisible = false;
        this.message.success(`Đặt lại mật khẩu thành công cho ${email}`);
      },
      error: () => this.message.error('Lỗi đặt lại mật khẩu')
    });
  }

  viewDetail(userId: number): void {
    this.http.get<{ data: any }>(`${this.API}/${userId}`).subscribe({
      next: (res) => {
        this.detailData = res.data;
        this.showDetail = true;
      },
      error: () => this.message.error('Lỗi lấy chi tiết hồ sơ')
    });
  }

  initials(name?: string): string {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  trackById(_: number, item: AdminUser): number {
    return item.userId;
  }
}
