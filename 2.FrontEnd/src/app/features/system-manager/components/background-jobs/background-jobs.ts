import { Component, OnInit } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { EnvironmentService, TokenService } from '../../../../core';
import { JwtUtils } from '../../../../shared/utils';

@Component({
  selector: 'app-background-jobs',
  imports: [CommonModule],
  templateUrl: './background-jobs.html',
  styleUrl: './background-jobs.scss'
})
export class BackgroundJobs implements OnInit {
  hangfireUrl!: SafeResourceUrl;
  isTokenValid = false;
  isLoading = true;

  constructor(
    private sanitizer: DomSanitizer,
    private env: EnvironmentService,
    private router: Router,
    private tokenService: TokenService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    const token = this.tokenService.getAccessToken();

    // Kiểm tra token hợp lệ trước khi load iframe
    if (!JwtUtils.isUsable(token)) {
      this.isLoading = false;
      this.isTokenValid = false;
      // Chuyển hướng về trang login nếu token hết hạn hoặc không tồn tại
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/system-manager/background-jobs' }
      });
      return;
    }

    // Lấy URL Hangfire: ưu tiên hangfireUrl trong env, nếu không thì xây dựng từ baseUrl
    const hangfireBase: string =
      this.env.getEnv('hangfireUrl') ||
      (this.env.getEnv('baseUrl') as string).replace(/\/api\/?$/, '') + '/hangfire';

    const baseUrl = (this.env.getEnv('baseUrl') as string) || '';
    this.http
      .post(`${baseUrl}/HangfireSession/EstablishSession`, null, { withCredentials: true })
      .subscribe({
        next: () => {
          this.hangfireUrl = this.sanitizer.bypassSecurityTrustResourceUrl(hangfireBase);
          this.isTokenValid = true;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.isTokenValid = false;
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/system-manager/background-jobs' },
          });
        },
      });
  }
}
