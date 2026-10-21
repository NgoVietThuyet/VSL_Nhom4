import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModules } from '../../ng-zorro.module';
import { AppDefinition, AppWindow, WindowManagerService } from '../../services/window-manager.service';
import { ViewModeService } from '../../services/view-mode.service';
import { GlobalService } from '../../../core';
import { DESKTOP_APP_RIGHT_BY_ID } from '../../constants';

@Component({
  selector: 'app-taskbar',
  imports: [SharedModules],
  standalone: true,
  templateUrl: './taskbar.html',
  styleUrl: './taskbar.scss',
})
export class Taskbar implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = '';
  windows: AppWindow[] = [];

  private clockTimer: any;

  constructor(
    public windowManager: WindowManagerService,
    public viewModeService: ViewModeService,
    private router: Router,
    private globalService: GlobalService,
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

    this.windowManager.windows$.subscribe(wins => {
      this.windows = wins;
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }

  get apps(): AppDefinition[] {
    return this.windowManager.appRegistry.filter(app => {
      const requiredRight = DESKTOP_APP_RIGHT_BY_ID[app.id];
      if (!requiredRight) {
        return true;
      }

      return this.globalService.hasRight(requiredRight);
    });
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.currentDate = now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  isRunning(appId: string): boolean {
    return this.windowManager.isAppRunning(appId);
  }

  getRunningCount(appId: string): number {
    return this.windowManager.getRunningCountByApp(appId);
  }

  getRunningDots(appId: string): number[] {
    const count = Math.min(this.windowManager.getRunningCountByApp(appId), 3);
    return Array.from({ length: count }, (_, i) => i);
  }

  onAppIconClick(appId: string): void {
    const running = this.windows.filter(w => w.appId === appId);

    if (running.length === 0) {
      this.windowManager.openApp(appId);
      return;
    }

    const topWin = running.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));

    if (topWin.state === 'minimized') {
      this.windowManager.focusWindow(topWin.id);
    } else if (this.windowManager.isActiveWindow(topWin.id)) {
      this.windowManager.minimizeWindow(topWin.id);
    } else {
      this.windowManager.focusWindow(topWin.id);
    }
  }

  onWindowTaskbarClick(win: AppWindow): void {
    if (win.state === 'minimized') {
      this.windowManager.focusWindow(win.id);
    } else if (this.windowManager.isActiveWindow(win.id)) {
      this.windowManager.minimizeWindow(win.id);
    } else {
      this.windowManager.focusWindow(win.id);
    }
  }

  switchToNormalMode(): void {
    const restoreUrl = this.getRestoreUrl();
    this.viewModeService.setMode('normal');
    this.router.navigateByUrl(restoreUrl, { replaceUrl: true });
  }

  trackById(_: number, item: AppWindow): string {
    return item.id;
  }

  trackByApp(_: number, item: AppDefinition): string {
    return item.id;
  }

  private getRestoreUrl(): string {
    const nonMinimized = this.windows.filter(win => win.state !== 'minimized');
    const candidatePool = nonMinimized.length > 0 ? nonMinimized : this.windows;

    if (candidatePool.length === 0) {
      return '/home';
    }

    const topWindow = candidatePool.reduce((currentTop, nextWindow) =>
      currentTop.zIndex > nextWindow.zIndex ? currentTop : nextWindow
    );

    return topWindow.routeUrl?.startsWith('/') ? topWindow.routeUrl : '/home';
  }
}
