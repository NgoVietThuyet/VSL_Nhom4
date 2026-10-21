import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SharedModules } from '../../ng-zorro.module';
import { GlobalService, LicenseService, LicenseStatus, TokenService } from '../../../core';
import { JwtUtils, LocalStorageUtils, StringUtils, TreeUtils } from '../../utils';
import { DeepSeekService, MainLayoutService, NotificationService, CallStateService, IncomingCallPayload, OnlinePresenceService, FirebaseMessagingService } from '../../services';
import { SignalRService } from '../../services/signalr.service';
import { NotificationDto } from '../../models';
import { MENU_PARENT_ROOT } from '../../utils/const';
import { ViewModeService } from '../../services/view-mode.service';
import { WindowManagerService } from '../../services/window-manager.service';
import { Desktop } from '../desktop/desktop';
import { FluentEmojiPipe } from '../../../features/chat/pipes/fluent-emoji.pipe';
import { ChatBot } from '../../../features/chat-bot/components/chat-bot';
import { WorkspaceUiService } from '../../../features/chat-bot/services/command/workspace-ui.service';
import { HandControl } from './hand-control/hand-control';

interface ChangePasswordModel {
  userName: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [SharedModules, Desktop, FluentEmojiPipe, ChatBot, HandControl],
  standalone: true,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit, OnDestroy {
  isCollapsed = false;
  isVisibleChangePass = false;
  breadcrumbs: any[] = [];
  searchMenu = '';
  menuTree: any[] = [];
  displayedMenuTree: any[] = [];
  /** URL menu leaf khớp route hiện tại (bỏ query/hash). */
  private activeMenuUrl: string | null = null;
  accountInfo: any;
  notifications: NotificationDto[] = [];
  unreadNotificationCount = 0;
  isNotificationPopoverVisible = false;
  notificationPage = 1;
  notificationHasMoreData = true;
  isLoadingMoreNotifications = false;

  modelChangePass: ChangePasswordModel = {
    userName: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };
  MENU_PARENT_ROOT = MENU_PARENT_ROOT;
  private lastCheckedToken = 0;
  private readonly CHECK_INTERVAL = 60 * 1000;
  private readonly destroy$ = new Subject<void>();

  viewMode: 'normal' | 'window' = 'normal';
  incomingCall: IncomingCallPayload | null = null;
  private ringAudio: HTMLAudioElement | null = null;

  isChatBotPopupOpen = false;
  isChatBotRoute = false;
  isHandControlOpen = false;

  licenseStatus: LicenseStatus | null = null;
  showLicenseBanner = false;

  constructor(
    private global: GlobalService,
    private service: MainLayoutService,
    private notification: NzNotificationService,
    private router: Router,
    private deepSeek: DeepSeekService,
    private signalR: SignalRService,
    private notificationService: NotificationService,
    public viewModeService: ViewModeService,
    public windowManager: WindowManagerService,
    private callStateService: CallStateService,
    private onlinePresence: OnlinePresenceService,
    private fcm: FirebaseMessagingService,
    private licenseService: LicenseService,
    private workspaceUi: WorkspaceUiService,
    private tokenService: TokenService,
  ) {
    this.accountInfo = LocalStorageUtils.getItem('accountInfo');
    this.licenseService.status$.pipe(takeUntil(this.destroy$)).subscribe(status => {
      this.licenseStatus = status;
      this.showLicenseBanner = !!status?.isValid && (status?.daysRemaining ?? 999) <= 30;
    });
  }

  ngOnInit(): void {
    if (!this.hasValidSession()) {
      return;
    }
    
    this.viewModeService.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => {
        this.viewMode = mode;

        if (mode === 'window') {
          if (this.router.url !== '/desktop') {
            this.router.navigate(['/desktop'], { replaceUrl: true });
          }
          return;
        }

        if (this.router.url === '/desktop') {
          this.router.navigate(['/home'], { replaceUrl: true });
        }
      });

    this.isChatBotRoute = this.router.url.startsWith('/chat-bot');
    this.initBreadcrumbs();
    this.getAllMenu();
    this.initEventListeners();
    this.subscribeWorkspaceUiActions();
    this.global.accountInfoUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => this.accountInfo = info);
    this.global.menuTreeRefresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.getAllMenu());
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        // Tự động đóng sidebar khi vào meeting/detail hoặc meeting/waiting
        if (url.includes('/meeting')) {
          this.isCollapsed = true;
        }
        // Ẩn FAB và đóng popup khi đang ở trang chat-bot
        this.isChatBotRoute = url.startsWith('/chat-bot');
        if (this.isChatBotRoute) {
          this.isChatBotPopupOpen = false;
        }
        this.refreshActiveMenuState(url);
      });
    this.signalR.start();
    this.onlinePresence.init();
    void this.fcm.initialize();
    this.callStateService.listenForCalls();
    this.callStateService.incomingCall$.pipe(takeUntil(this.destroy$)).subscribe(call => {
      this.incomingCall = call;
      call ? this.startRinging() : this.stopRinging();
    });
    this.loadUnreadCount();
    this.loadNotifications();
    this.signalR.notificationReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((noti: NotificationDto) => {
        const index = this.notifications.findIndex(n => 
          noti.type === 'Chat' &&
          n.type === 'Chat' && 
          n.referenceId === noti.referenceId && 
          !!noti.referenceId
        );

        if (index !== -1) {
          const oldNoti = this.notifications[index];
          this.notifications.splice(index, 1);
          
          if (oldNoti.isRead) {
            this.unreadNotificationCount++;
          }
        } else {
          this.unreadNotificationCount++;
        }

        this.notifications = [noti, ...this.notifications];
      });

    this.signalR.notificationReadStateChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: any) => {
        const affectedIds = Array.isArray(state?.notificationIds) ? state.notificationIds : [];

        if (state?.action === 'MarkAllAsRead') {
          this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        } else if (state?.action === 'MarkAsRead' && affectedIds.length > 0) {
          const idSet = new Set<string>(affectedIds);
          this.notifications = this.notifications.map(n => idSet.has(n.id) ? { ...n, isRead: true } : n);
        }

        if (typeof state?.unreadCount === 'number') {
          this.unreadNotificationCount = Math.max(0, state.unreadCount);
        } else {
          this.unreadNotificationCount = this.notifications.filter(n => !n.isRead).length;
        }
      });
  }

  ngOnDestroy(): void {
    this.stopRinging();
    this.signalR.stop();
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('fullscreenchange', this.handleFullscreen);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private initBreadcrumbs(): void {
    this.breadcrumbs = this.global.breadcrumb || [];
    this.global.breadcrumbSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: any) => this.breadcrumbs = value);
  }

  private initEventListeners(): void {
    document.addEventListener('fullscreenchange', this.handleFullscreen);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  getAllMenu(): void {
    this.service.getMenuByUser(this.accountInfo.userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.menuTree = TreeUtils.buildNzMenuTree(res);
          this.displayedMenuTree = [...this.menuTree];
          this.refreshActiveMenuState();
        }
      });
  }

  isMenuItemActive(menu: any): boolean {
    return !!menu?.url && menu.url === this.activeMenuUrl;
  }

  private refreshActiveMenuState(url?: string): void {
    const path = this.getRoutePath(url ?? this.router.url);
    this.activeMenuUrl = this.findActiveMenuUrl(this.menuTree, path);
    this.syncActiveRouteMenu(this.menuTree, path);
    this.syncActiveRouteMenu(this.displayedMenuTree, path);
    this.menuTree = [...this.menuTree];
    this.displayedMenuTree = [...this.displayedMenuTree];
  }

  private getRoutePath(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  /** Chọn menu leaf khớp nhất (URL dài nhất) để tránh highlight nhiều mục cùng prefix. */
  private findActiveMenuUrl(menuTree: any[], currentPath: string): string | null {
    let best: string | null = null;
    const visit = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.url && this.menuUrlMatches(node.url, currentPath)) {
          if (!best || node.url.length > best.length) {
            best = node.url;
          }
        }
        if (node.children?.length) {
          visit(node.children);
        }
      }
    };
    visit(menuTree);
    return best;
  }

  private syncActiveRouteMenu(menuTree: any[], url?: string): void {
    const currentPath = url ? this.getRoutePath(url) : this.getRoutePath(this.router.url);
    const expandPath = (nodes: any[]): boolean => {
      for (const node of nodes) {
        if (node.url && this.menuUrlMatches(node.url, currentPath)) {
          return true;
        }
        if (node.children?.length && expandPath(node.children)) {
          node.open = true;
          return true;
        }
      }
      return false;
    };
    expandPath(menuTree);
  }

  private menuUrlMatches(menuUrl: string, currentPath: string): boolean {
    if (!menuUrl || menuUrl.startsWith('#')) {
      return false;
    }
    if (currentPath === menuUrl) {
      return true;
    }
    return menuUrl !== '/' && currentPath.startsWith(`${menuUrl}/`);
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleHandControl(): void {
    this.isHandControlOpen = !this.isHandControlOpen;
  }

  switchToWindowMode(): void {
    const currentUrl = this.router.url;
    this.viewModeService.setMode('window');

    const openedCurrentRoute = currentUrl !== '/desktop'
      ? this.windowManager.openRoute(currentUrl)
      : false;

    if (!openedCurrentRoute && this.windowManager.windows.length === 0) {
      this.windowManager.openApp('home');
    }
  }

  get sidebarCollapsed(): boolean {
    return this.isCollapsed;
  }

  get userDropdownPlacement(): 'topCenter' | 'bottomRight' {
    return this.sidebarCollapsed ? 'bottomRight' : 'topCenter';
  }

  get displayFullName(): string {
    return this.accountInfo?.fullName || this.accountInfo?.userName || 'Người dùng';
  }

  get displayEmail(): string {
    return this.accountInfo?.email || this.accountInfo?.userName || '';
  }

  get userAvatarText(): string {
    return this.global.getInitialsAvatar(this.displayFullName);
  }

  get userAvatarColor(): string {
    return this.global.getAvatarColor(this.accountInfo?.userName || this.displayFullName);
  }

  get userAvatarUrl(): string | null {
    return this.global.getAccountAvatarUrl(
      this.accountInfo?.userName,
      this.accountInfo?.avatarFileId,
      this.accountInfo?.avatarVersion
    );
  }

  openNotifications(): void {
    this.isNotificationPopoverVisible = true;
    if (this.notifications.length === 0) {
      this.loadNotifications(false);
    }
  }

  closeNotificationPopover(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isNotificationPopoverVisible = false;
  }

  get isGuestAccount(): boolean {
    return this.accountInfo?.isGuest === true || this.accountInfo?.isGuest === 'true';
  }

  onOpenChange(changedMenu: any, isOpen: boolean): void {
    this.updateMenuOpenState(this.menuTree, changedMenu.key, changedMenu.level, isOpen);
    this.updateMenuOpenState(this.displayedMenuTree, changedMenu.key, changedMenu.level, isOpen);
    this.menuTree = [...this.menuTree];
    this.displayedMenuTree = [...this.displayedMenuTree];
  }

  onSearchChangeMenu(): void {
    const keyword = this.searchMenu?.trim().toLowerCase();
    this.displayedMenuTree = keyword
      ? this.filterMenuTree(this.menuTree, keyword)
      : [...this.menuTree];
    this.syncActiveRouteMenu(this.displayedMenuTree);
    this.displayedMenuTree = [...this.displayedMenuTree];
  }

  private filterMenuTree(menuTree: any[], keyword: string): any[] {
    return menuTree.reduce((result: any[], node) => {
      const childrenMatched = node.children
        ? this.filterMenuTree(node.children, keyword)
        : [];
      const nameMatched = node.name.toLowerCase().includes(keyword);

      if (nameMatched || childrenMatched.length > 0) {
        result.push({
          ...node,
          children: childrenMatched.length > 0 ? childrenMatched : node.children || null,
          open: childrenMatched.length > 0 || node.open
        });
      }
      return result;
    }, []);
  }

  private updateMenuOpenState(menuTree: any[], key: string, level: number, isOpen: boolean): void {
    menuTree.forEach(node => {
      if (level === 1 && node.level === 1) {
        node.open = node.key === key ? isOpen : false;
      } else if (node.key === key) {
        node.open = isOpen;
      }

      if (node.children?.length) {
        this.updateMenuOpenState(node.children, key, level, isOpen);
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: any) => this.unreadNotificationCount = count || 0);
  }

  loadNotifications(isAppend: boolean = false): void {
    if (this.isLoadingMoreNotifications) return;
    
    if (!isAppend) {
      this.notificationPage = 1;
      this.notificationHasMoreData = true;
    }

    this.isLoadingMoreNotifications = true;
    this.notificationService.getByUser(this.notificationPage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingMoreNotifications = false)
      )
      .subscribe((res: any) => {
        const items = res?.data || res || [];
        if (isAppend) {
          this.notifications = [...this.notifications, ...items];
        } else {
          this.notifications = items;
        }
        this.notificationHasMoreData = items.length >= 20;
      });
  }

  onNotificationPopoverVisibleChange(visible: boolean): void {
    this.isNotificationPopoverVisible = visible;
    if (visible && this.notifications.length === 0) {
      this.loadNotifications(false);
    }
  }

  onNotificationClick(noti: NotificationDto): void {
    if (!noti.isRead) {
      this.notificationService.markAsRead(noti.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          noti.isRead = true;
          this.loadUnreadCount();
        });
    }
    this.isNotificationPopoverVisible = false;
    if (noti.url) {
      this.router.navigateByUrl(noti.url);
    }
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadNotificationCount = 0;
      });
  }

  onNotificationScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 50;
    const position = el.scrollTop + el.clientHeight;
    const height = el.scrollHeight;

    if (height - position < threshold) {
      if (!this.isLoadingMoreNotifications && this.notificationHasMoreData) {
        this.notificationPage++;
        this.loadNotifications(true);
      }
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'Chat': return 'message';
      case 'System': return 'setting';
      case 'Task': return 'check-circle';
      default: return 'bell';
    }
  }

  changePassOpen(): void {
    this.resetModelChangePass();
    this.isVisibleChangePass = true;
  }

  changePassOk(): void {
    const { currentPassword, newPassword, confirmNewPassword } = this.modelChangePass;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.notification.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.notification.error('Lỗi', 'Mật khẩu xác nhận không giống với mật khẩu mới!');
      return;
    }
    this.modelChangePass.userName = this.accountInfo.userName
    this.service.changePassword(this.modelChangePass).subscribe({
      next: (resp) => {
        if (resp.status) {
          this.startLogoutCountdown();
        }
      }
    })
  }

  changePassCancel(): void {
    this.resetModelChangePass();
    this.isVisibleChangePass = false;
  }

  private resetModelChangePass(): void {
    this.modelChangePass = {
      userName: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    };
  }

  private startLogoutCountdown(): void {
    let countdown = 5;
    const notiKey = 'countdown';

    const updateNotification = () => {
      this.notification.success(
        'Đổi mật khẩu thành công!',
        `Hệ thống sẽ khởi động lại sau ${countdown}s!`,
        { nzKey: notiKey, nzDuration: 0 }
      );
    };

    updateNotification();

    const timer = setInterval(() => {
      countdown--;
      updateNotification();

      if (countdown === 0) {
        clearInterval(timer);
        this.notification.remove(notiKey);
        this.logOut();
      }
    }, 1000);
  }

  acceptIncomingCall() {
    if (!this.incomingCall) return;
    const call = this.incomingCall;
    this.callStateService.acceptCall(call);
    this.router.navigate(['/chat'], { queryParams: { id: call.conversationId } });
  }

  rejectIncomingCall() {
    if (!this.incomingCall) return;
    this.callStateService.rejectCall(this.incomingCall);
  }

  private startRinging() {
    this.stopRinging();
    try {
      this.ringAudio = new Audio('mp3/notification.mp3');
      this.ringAudio.loop = true;
      this.ringAudio.play().catch(() => {});
    } catch {
      this.ringAudio = null;
    }
  }

  private stopRinging() {
    if (this.ringAudio) {
      this.ringAudio.pause();
      this.ringAudio = null;
    }
  }

  navigateRoute(route: string): void {
    this.router.navigate([route]);
  }

  openChatBot(): void {
    this.router.navigate(['/chat-bot']);
  }

  toggleChatBotPopup(): void {
    this.isChatBotPopupOpen = !this.isChatBotPopupOpen;
  }

  closeChatBotPopup(): void {
    this.isChatBotPopupOpen = false;
  }

  maximizeChatBot(conversationId: string | null): void {
    this.isChatBotPopupOpen = false;
    this.router.navigate(['/chat-bot'], {
      queryParams: conversationId ? { conversationId } : {}
    });
  }

  /**
   * React to chat-bot voice/text command UI actions
   * (minimize_chat, toggle_sidebar, etc.).
   */
  private subscribeWorkspaceUiActions(): void {
    this.workspaceUi.stream$
      .pipe(takeUntil(this.destroy$))
      .subscribe(evt => {
        switch (evt.action) {
          case 'minimize_chat':
          case 'close_chat':
            this.closeChatBotPopup();
            break;
          case 'maximize_chat':
            this.maximizeChatBot(null);
            break;
          case 'toggle_sidebar':
            this.toggleSidebar();
            break;
          // enable_dark_mode / disable_dark_mode / clear_chat handled elsewhere
        }
      });
  }

  logOut(): void {
    void this.fcm.unregisterToken();
    this.signalR.stop();
    this.onlinePresence.reset();
    this.tokenService.logout().subscribe(() => {
      LocalStorageUtils.clear();
      this.tokenService.clear();
      this.navigateRoute('login');
    });
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  onUserInteraction(): void {
    const now = Date.now();
    if (now - this.lastCheckedToken > this.CHECK_INTERVAL) {
      this.checkToken();
      this.lastCheckedToken = now;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isNotificationPopoverVisible) return;

    const target = event.target as HTMLElement;

    // Do not close if the click was inside the notification popover itself,
    // or inside the user profile trigger, or inside the user dropdown menu.
    if (
      target.closest('.notification-popover') ||
      target.closest('.user-profile-trigger') ||
      target.closest('.sidebar-user-dropdown')
    ) {
      return;
    }

    this.isNotificationPopoverVisible = false;
  }

  private handleFullscreen = (): void => {
    this.isCollapsed = !!document.fullscreenElement;
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkToken();
    }
  };

  private checkToken(): void {
    if (!this.tokenService.hasValidAccessToken()) {
      this.tokenService.ensureSession().subscribe((ok) => {
        if (!ok) {
          this.onlinePresence.reset();
          LocalStorageUtils.clear();
          this.tokenService.clear();
          this.router.navigate(['/login']);
        }
      });
    }
  }

  private hasValidSession(): boolean {
    if (!this.tokenService.hasValidAccessToken()) {
      this.onlinePresence.reset();
      LocalStorageUtils.clear();
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}