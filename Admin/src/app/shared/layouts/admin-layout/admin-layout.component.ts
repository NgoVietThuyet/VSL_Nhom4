import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModules } from '../../ng-zorro.module';
import { initials, roleLabel } from '../../labels';

interface AdminMenuItem {
  name: string;
  url: string;
  icon: string;
}

/** Điểm ngắt màn hình: dưới MOBILE là điện thoại, dưới WIDE là máy tính bảng / laptop nhỏ. */
const MOBILE_QUERY = '(max-width: 767.98px)';
const COMPACT_QUERY = '(min-width: 768px) and (max-width: 1199.98px)';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private breakpoints = inject(BreakpointObserver);
  authService = inject(AuthService);
  currentUser = this.authService.getStoredUser();

  /** Lựa chọn thu gọn của người dùng trên màn hình rộng. */
  sidebarCollapsed = false;
  isMobile = false;
  isCompact = false;
  mobileMenuOpen = false;

  searchMenu = '';
  currentUrl = this.router.url;

  readonly menuItems: AdminMenuItem[] = [
    { name: 'Tổng quan', url: '/dashboard', icon: 'grid-1x2' },
    { name: 'Người dùng', url: '/users', icon: 'people' },
    { name: 'Chủ đề bài học', url: '/topics', icon: 'collection-play' },
    { name: 'Ký hiệu & Video', url: '/signs', icon: 'hand-index-thumb' },
    { name: 'Ngân hàng Quiz', url: '/quiz', icon: 'patch-question' },
    { name: 'Giám sát AI Camera', url: '/monitoring', icon: 'camera-video' },
    { name: 'Cấu hình hệ thống', url: '/system', icon: 'gear' },
  ];
  displayedMenu = this.menuItems;

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((e: NavigationEnd) => {
        this.currentUrl = e.urlAfterRedirects;
        // Trên điện thoại: chọn mục xong thì đóng menu để thấy nội dung
        this.mobileMenuOpen = false;
      });

    this.breakpoints
      .observe([MOBILE_QUERY, COMPACT_QUERY])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.isMobile = state.breakpoints[MOBILE_QUERY];
        this.isCompact = state.breakpoints[COMPACT_QUERY];
        if (!this.isMobile) this.mobileMenuOpen = false;
      });
  }

  /** Thanh bên đang ở dạng biểu tượng (68px). Điện thoại luôn hiện đầy đủ khi mở menu. */
  get collapsed(): boolean {
    if (this.isMobile) return false;
    return this.isCompact || this.sidebarCollapsed;
  }

  get currentPageName(): string {
    return this.menuItems.find(m => this.isMenuItemActive(m))?.name || 'Quản trị';
  }

  get displayFullName(): string {
    return this.currentUser?.fullName || 'Quản trị viên';
  }

  get displayEmail(): string {
    return this.currentUser?.email || 'admin';
  }

  get displayRole(): string {
    return roleLabel(this.currentUser?.role);
  }

  get avatarText(): string {
    return initials(this.displayFullName);
  }

  isMenuItemActive(menu: AdminMenuItem): boolean {
    return this.currentUrl === menu.url || this.currentUrl.startsWith(menu.url + '/')
      || this.currentUrl.startsWith(menu.url + '?');
  }

  onSearchChangeMenu(): void {
    const keyword = this.searchMenu.trim().toLowerCase();
    this.displayedMenu = keyword
      ? this.menuItems.filter(m => m.name.toLowerCase().includes(keyword))
      : this.menuItems;
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      return;
    }
    if (this.isCompact) return; // màn vừa: luôn dạng biểu tượng để nhường chỗ cho nội dung
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileMenuOpen) this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
