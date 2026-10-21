import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModules } from '../../ng-zorro.module';

interface AdminMenuItem {
  name: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SharedModules],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  private router = inject(Router);
  authService = inject(AuthService);
  currentUser = this.authService.getStoredUser();

  sidebarCollapsed = false;
  searchMenu = '';
  currentUrl = this.router.url;

  readonly menuItems: AdminMenuItem[] = [
    { name: 'Tổng quan', url: '/dashboard', icon: 'grid-1x2' },
    { name: 'Học viên', url: '/users', icon: 'people' },
    { name: 'Chủ đề bài học', url: '/topics', icon: 'collection-play' },
    { name: 'Ký hiệu & Video', url: '/signs', icon: 'hand-index-thumb' },
    { name: 'Ngân hàng Quiz', url: '/quiz', icon: 'patch-question' },
    { name: 'Giám sát AI Camera', url: '/monitoring', icon: 'camera-video' },
    { name: 'Cấu hình hệ thống', url: '/system', icon: 'gear' },
  ];
  displayedMenu = this.menuItems;

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.currentUrl = e.urlAfterRedirects);
  }

  get displayFullName(): string {
    return this.currentUser?.fullName || 'Quản trị viên';
  }

  get displayEmail(): string {
    return this.currentUser?.email || 'admin';
  }

  get avatarText(): string {
    return this.displayFullName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  isMenuItemActive(menu: AdminMenuItem): boolean {
    return this.currentUrl === menu.url || this.currentUrl.startsWith(menu.url + '/');
  }

  onSearchChangeMenu(): void {
    const keyword = this.searchMenu.trim().toLowerCase();
    this.displayedMenu = keyword
      ? this.menuItems.filter(m => m.name.toLowerCase().includes(keyword))
      : this.menuItems;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
