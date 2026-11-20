import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableSortFn } from 'ng-zorro-antd/table';
import { SharedModules } from '../../shared/ng-zorro.module';
import { API_BASE } from '../../core/config/api.config';
import {
  ROLE_OPTIONS, ACCOUNT_STATUS, accountStatusLabel, initials, isAdminRole, roleLabel,
} from '../../shared/labels';

export interface AdminUser {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  xp?: number;
  level?: number;
  /** Chuỗi ngày học — Backend tính từ lịch sử học thật. */
  streakDays?: number;
  /** Con số lưu trong CSDL mà ứng dụng học viên đang hiển thị. */
  storedStreakDays?: number;
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
  private route = inject(ActivatedRoute);

  /** Toàn bộ tài khoản lấy từ máy chủ; lọc tại trình duyệt để số đếm luôn khớp. */
  private allUsers: AdminUser[] = [];
  users: AdminUser[] = [];
  loading = false;
  searchQuery = '';
  selectedRole: string | null = null;
  selectedStatus: string | null = null;

  pageIndex = 1;
  pageSize = 20;

  readonly roleOptions = ROLE_OPTIONS;
  readonly accountStatus = ACCOUNT_STATUS;
  readonly accountStatusLabel = accountStatusLabel;
  readonly roleLabel = roleLabel;
  readonly isAdminRole = isAdminRole;
  readonly initials = initials;

  readonly sortName: NzTableSortFn<AdminUser> = (a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi');
  readonly sortLevel: NzTableSortFn<AdminUser> = (a, b) => (a.level || 1) - (b.level || 1);
  readonly sortXp: NzTableSortFn<AdminUser> = (a, b) => (a.xp || 0) - (b.xp || 0);
  readonly sortStreak: NzTableSortFn<AdminUser> = (a, b) => (a.streakDays || 0) - (b.streakDays || 0);

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
    // Cho phép mở sẵn bộ lọc từ thẻ KPI, ví dụ /users?role=STUDENT
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role && ROLE_OPTIONS.some(r => r.value === role.toUpperCase())) {
      this.selectedRole = role.toUpperCase();
    }
    this.fetch();
  }

  get studentCount(): number {
    return this.allUsers.filter(u => !isAdminRole(u.role)).length;
  }

  get adminCount(): number {
    return this.allUsers.filter(u => isAdminRole(u.role)).length;
  }

  get lockedCount(): number {
    return this.allUsers.filter(u => !u.status).length;
  }

  /** Số trên app học viên khác số tính từ lịch sử học → cảnh báo để admin biết vì sao lệch. */
  streakMismatch(u: AdminUser): boolean {
    return u.storedStreakDays != null && (u.storedStreakDays || 0) !== (u.streakDays || 0);
  }

  get hasFilter(): boolean {
    return !!(this.searchQuery.trim() || this.selectedRole || this.selectedStatus);
  }

  fetch(): void {
    this.loading = true;
    this.http.get<{ code: number; data: AdminUser[] }>(this.API).subscribe({
      next: (res) => {
        this.allUsers = res.data || [];
        this.loading = false;
        this.search();
      },
      error: () => {
        this.message.error('Không thể tải danh sách người dùng từ máy chủ.');
        this.loading = false;
      }
    });
  }

  /** Lọc theo tên/email/SĐT, vai trò, trạng thái — cùng quy tắc với API cũ. */
  search(): void {
    this.pageIndex = 1;
    const s = this.searchQuery.trim().toLowerCase();
    this.users = this.allUsers.filter(u => {
      if (s && !((u.fullName || '').toLowerCase().includes(s)
        || (u.email || '').toLowerCase().includes(s)
        || (u.phone || '').includes(s))) return false;
      if (this.selectedRole && (u.role || '').toUpperCase() !== this.selectedRole) return false;
      if (this.selectedStatus != null && String(!!u.status) !== this.selectedStatus) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedRole = null;
    this.selectedStatus = null;
    this.search();
  }

  reset(): void {
    this.clearFilters();
    this.fetch();
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
    // Chuỗi ngày học do hệ thống tự tính, không gửi giá trị nhập tay
    const payload = { ...this.dto };
    delete payload.streakDays;
    const req = this.isEdit
      ? this.http.put(`${this.API}/${this.dto.userId}`, payload)
      : this.http.post(this.API, payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.visible = false;
        this.message.success(this.isEdit ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công');
        this.fetch();
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
        this.fetch();
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

  trackById(_: number, item: AdminUser): number {
    return item.userId;
  }
}
