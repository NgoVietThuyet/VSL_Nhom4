import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SharedModules } from '../../shared/ng-zorro.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Tài khoản mặc định: admin / admin@123
  email = 'admin';
  password = 'admin@123';
  passwordVisible = false;
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }
  }

  handleLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Vui lòng nhập tài khoản và mật khẩu';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.data?.user?.role?.toUpperCase() !== 'ADMIN') {
          this.errorMessage = 'Tài khoản không có quyền truy cập Quản trị viên (Role: ' + res?.data?.user?.role + ')';
          this.authService.logout();
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc kết nối Backend.';
      }
    });
  }
}
